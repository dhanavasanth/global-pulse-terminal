"""
Ollama Client — Wrapper for local Llama3.1 inference.
Provides structured prompt building, JSON parsing, and retry logic.
"""

import json
import re
import logging
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Try importing ollama; graceful fallback if not installed
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    logger.warning("⚠️ ollama package not installed. AI reasoning will be disabled.")


class OllamaClient:
    """
    Wrapper around ollama.chat() for Llama3.1.
    Handles prompt construction, response parsing, timeouts, and retries.
    """

    DEFAULT_MODEL = "llama3.1"
    DEFAULT_TIMEOUT = 30  # seconds
    MAX_RETRIES = 3

    def __init__(self, model: str = None):
        self.model = model or self.DEFAULT_MODEL
        self._available = OLLAMA_AVAILABLE
        if self._available:
            try:
                # Test connectivity
                ollama.list()
                logger.info(f"✅ Ollama connected. Using model: {self.model}")
            except Exception as e:
                logger.warning(f"⚠️ Ollama not reachable: {e}. AI reasoning disabled.")
                self._available = False

    @property
    def is_available(self) -> bool:
        return self._available

    def chat(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.3,
        max_retries: int = None,
    ) -> str:
        """
        Send a chat prompt to Llama3.1 and return the response text.
        Falls back to empty string if Ollama is unavailable.
        """
        if not self._available:
            logger.debug("Ollama unavailable, returning empty response")
            return ""

        retries = max_retries or self.MAX_RETRIES
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        for attempt in range(retries):
            try:
                start = time.time()
                response = ollama.chat(
                    model=self.model,
                    messages=messages,
                    options={"temperature": temperature},
                )
                elapsed = (time.time() - start) * 1000
                content = response["message"]["content"]
                logger.debug(f"Ollama response in {elapsed:.0f}ms ({len(content)} chars)")
                return content

            except Exception as e:
                logger.warning(f"Ollama attempt {attempt + 1}/{retries} failed: {e}")
                if attempt < retries - 1:
                    time.sleep(1 * (attempt + 1))  # Backoff
                else:
                    logger.error(f"Ollama failed after {retries} attempts")
                    return ""

    def chat_json(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Send a prompt and expect a JSON response.
        Parses JSON from the response, handling markdown code blocks.
        """
        json_system = (system_prompt or "") + (
            "\n\nIMPORTANT: You MUST respond with valid JSON only. "
            "No markdown, no explanation, just the JSON object."
        )

        response = self.chat(prompt, system_prompt=json_system, temperature=temperature)
        return self._parse_json(response)

    def reason(
        self,
        task: str,
        data: Dict[str, Any],
        output_format: str = "json",
    ) -> Dict[str, Any]:
        """
        High-level reasoning function. Builds a chain-of-thought prompt
        with structured data input and expected output format.
        """
        system_prompt = (
            "You are an expert Indian stock market analyst specializing in "
            "intraday options trading for Nifty50, Sensex, and BankNifty. "
            "Think step-by-step. Be precise with numbers. "
            "Always consider risk management."
        )

        # Truncate data for prompt size management
        data_str = json.dumps(data, default=str, indent=2)
        if len(data_str) > 4000:
            data_str = data_str[:4000] + "\n... (truncated)"

        prompt = f"""## Task
{task}

## Input Data
```json
{data_str}
```

## Instructions
1. Analyze the data step by step
2. Show your reasoning
3. Provide your conclusion

Respond with a JSON object containing your analysis."""

        if output_format == "json":
            return self.chat_json(prompt, system_prompt=system_prompt)
        else:
            text = self.chat(prompt, system_prompt=system_prompt)
            return {"response": text}

    @staticmethod
    def _parse_json(text: str) -> Dict[str, Any]:
        """
        Parse JSON from LLM response text.
        Handles markdown code blocks, extra text, etc.
        """
        if not text:
            return {}

        # Try direct parse first
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # Try extracting from markdown code block
        json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # Try finding first { ... } block
        brace_match = re.search(r'\{.*\}', text, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass

        # Last resort: return as text
        logger.warning("Could not parse JSON from Ollama response")
        return {"raw_response": text}

    def build_agent_prompt(
        self,
        agent_name: str,
        steps: List[str],
        data: Dict[str, Any],
        output_fields: List[str],
    ) -> str:
        """
        Build a structured chain-of-thought prompt for an agent.
        Each agent gets a standardized format with numbered steps.
        """
        data_str = json.dumps(data, default=str, indent=2)
        if len(data_str) > 3000:
            data_str = data_str[:3000] + "\n... (truncated)"

        steps_str = "\n".join(f"Step {i+1}: {s}" for i, s in enumerate(steps))
        fields_str = ", ".join(f'"{f}"' for f in output_fields)

        return f"""You are the {agent_name} in an autonomous trading system.

## Your Input Data
```json
{data_str}
```

## Your Task (follow these steps in order)
{steps_str}

## Required Output Format
Respond with a JSON object containing these fields: {{{fields_str}}}
Include a "reasoning" field explaining your step-by-step analysis."""
