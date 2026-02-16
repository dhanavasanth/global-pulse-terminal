"""
Angel One SmartAPI Python Client
Handles authentication (TOTP + JWT), LTP quotes, and options chain data.
Mirrors the frontend src/lib/angelone/ patterns for consistency.
"""

import os
import re
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Optional imports with graceful fallback
try:
    from SmartApi import SmartConnect
    SMARTAPI_AVAILABLE = True
except ImportError:
    SMARTAPI_AVAILABLE = False
    logger.warning("⚠️ smartapi-python not installed. Run: pip install smartapi-python")

try:
    import pyotp
    PYOTP_AVAILABLE = True
except ImportError:
    PYOTP_AVAILABLE = False
    logger.warning("⚠️ pyotp not installed. Run: pip install pyotp")


# Common token mapping — same as frontend src/lib/angelone/types.ts COMMON_TOKENS
COMMON_TOKENS = {
    "NIFTY": {"exchange": "NSE", "tradingsymbol": "NIFTY 50", "symboltoken": "99926000"},
    "BANKNIFTY": {"exchange": "NSE", "tradingsymbol": "NIFTY BANK", "symboltoken": "99926009"},
    "SENSEX": {"exchange": "BSE", "tradingsymbol": "SENSEX", "symboltoken": "99919000"},
}


class AngelOneClient:
    """
    Python client for Angel One SmartAPI.
    Provides authentication, LTP, and option chain data for AutoTrade agents.
    """

    def __init__(self):
        self._smart_api: Optional[SmartConnect] = None
        self._session_data: Optional[Dict] = None
        self._feed_token: Optional[str] = None
        self._auth_time: float = 0
        self._session_ttl = 23 * 3600  # Re-auth after 23 hours

        # Load credentials from .env
        self._api_key = os.getenv("ANGELONE_API_KEY", os.getenv("VITE_ANGELONE_API_KEY", ""))
        self._client_id = os.getenv("ANGELONE_CLIENT_ID", os.getenv("VITE_ANGELONE_CLIENT_ID", ""))
        self._password = os.getenv("ANGELONE_PASSWORD", os.getenv("VITE_ANGELONE_PASSWORD", ""))
        self._totp_secret = os.getenv("ANGELONE_TOTP_SECRET", os.getenv("VITE_ANGELONE_TOTP_SECRET", ""))

    @property
    def is_available(self) -> bool:
        """Check if SmartAPI SDK + credentials are available."""
        return SMARTAPI_AVAILABLE and bool(self._api_key and self._client_id and self._password)

    @property
    def is_authenticated(self) -> bool:
        """Check if we have a valid session."""
        if not self._session_data:
            return False
        if time.time() - self._auth_time > self._session_ttl:
            return False
        return True

    def login(self) -> bool:
        """
        Authenticate with Angel One SmartAPI.
        Uses pyotp for TOTP generation if secret is available.
        Returns True on success, False on failure.
        """
        if not self.is_available:
            logger.warning("[AngelOne] SDK or credentials not available")
            return False

        try:
            self._smart_api = SmartConnect(api_key=self._api_key)

            # Generate TOTP
            totp = self._generate_totp()
            if not totp:
                logger.error("[AngelOne] Failed to generate TOTP")
                return False

            # Login
            session_data = self._smart_api.generateSession(
                clientCode=self._client_id,
                password=self._password,
                totp=totp,
            )

            if session_data and session_data.get("status"):
                self._session_data = session_data.get("data", {})
                self._feed_token = self._smart_api.getfeedToken()
                self._auth_time = time.time()
                logger.info(f"[AngelOne] ✅ Session established for client {self._client_id}")
                return True
            else:
                msg = session_data.get("message", "Unknown error") if session_data else "No response"
                logger.error(f"[AngelOne] ❌ Login failed: {msg}")
                return False

        except Exception as e:
            logger.error(f"[AngelOne] ❌ Login exception: {e}")
            self._smart_api = None
            return False

    def _generate_totp(self) -> Optional[str]:
        """Generate TOTP from secret. Falls back to using secret as static OTP."""
        if not self._totp_secret:
            return None

        # If pyotp is available and secret looks like a base32 key, generate TOTP
        if PYOTP_AVAILABLE and len(self._totp_secret) > 10:
            try:
                totp = pyotp.TOTP(self._totp_secret)
                code = totp.now()
                logger.debug(f"[AngelOne] Generated TOTP via pyotp")
                return code
            except Exception as e:
                logger.warning(f"[AngelOne] pyotp generation failed: {e}, using raw value")

        # Fallback: use the value directly (static OTP / manual TOTP)
        return str(self._totp_secret)

    def _ensure_session(self) -> bool:
        """Ensure we have an active session, re-login if needed."""
        if self.is_authenticated:
            return True
        return self.login()

    # ─── Market Data APIs ───────────────────────────────────────────

    def get_ltp(self, exchange: str, symbol_token: str) -> Optional[float]:
        """Fetch LTP for a single symbol."""
        if not self._ensure_session():
            return None

        try:
            data = self._smart_api.ltpData(
                exchange=exchange,
                tradingsymbol="",
                symboltoken=symbol_token,
            )
            if data and data.get("status") and data.get("data"):
                return float(data["data"].get("ltp", 0))
        except Exception as e:
            logger.warning(f"[AngelOne] LTP fetch failed for {symbol_token}: {e}")

        return None

    def get_index_ltp(self) -> Dict[str, float]:
        """Fetch LTP for NIFTY, SENSEX, BANKNIFTY."""
        if not self._ensure_session():
            return {}

        result = {}
        index_map = {
            "nifty50": COMMON_TOKENS["NIFTY"],
            "sensex": COMMON_TOKENS["SENSEX"],
            "banknifty": COMMON_TOKENS["BANKNIFTY"],
        }

        for name, token_info in index_map.items():
            ltp = self.get_ltp(token_info["exchange"], token_info["symboltoken"])
            if ltp is not None and ltp > 0:
                result[name] = ltp

        if result:
            logger.info(f"[AngelOne] 📊 Index LTP: {result}")

        return result

    def get_option_chain(
        self,
        underlying: str = "NIFTY",
        num_strikes: int = 11,
    ) -> List[Dict]:
        """
        Fetch options chain for NIFTY or BANKNIFTY.

        Strategy:
        1. Get underlying LTP to determine ATM
        2. Search for option scrips near ATM
        3. Fetch full quotes (LTP, OI, volume) for found scrips

        Returns list of option dicts compatible with data_fetcher_agent format.
        """
        if not self._ensure_session():
            return []

        try:
            # 1. Get underlying price
            token_info = COMMON_TOKENS.get(underlying.upper())
            if not token_info:
                logger.warning(f"[AngelOne] Unknown underlying: {underlying}")
                return []

            underlying_ltp = self.get_ltp(token_info["exchange"], token_info["symboltoken"])
            if not underlying_ltp:
                logger.warning(f"[AngelOne] Could not fetch {underlying} LTP")
                return []

            # 2. Determine strike range
            strike_gap = 100 if underlying.upper() == "BANKNIFTY" else 50
            atm_strike = round(underlying_ltp / strike_gap) * strike_gap
            half_range = (num_strikes // 2) * strike_gap
            strike_low = int(atm_strike - half_range)
            strike_high = int(atm_strike + half_range)

            # 3. Get next expiry date
            expiry_str = self._get_next_expiry_formatted()

            # 4. Search for option scrips
            deriv_exchange = "NFO" if underlying.upper() != "SENSEX" else "BFO"
            search_query = f"{underlying.upper()} {expiry_str}"

            logger.info(f"[AngelOne] Searching options: {search_query} on {deriv_exchange}")

            search_results = self._smart_api.searchScrip(
                exchange=deriv_exchange,
                searchscrip=search_query,
            )

            if not search_results or not search_results.get("data"):
                logger.warning(f"[AngelOne] No scrips found for: {search_query}")
                return []

            scrips = search_results["data"]

            # 5. Filter to CE/PE within strike range
            relevant_scrips = []
            for scrip in scrips:
                symbol = scrip.get("tradingsymbol", "") or scrip.get("symbol", "")
                if not (symbol.endswith("CE") or symbol.endswith("PE")):
                    continue
                if expiry_str not in symbol:
                    continue

                # Extract strike from symbol
                strike = self._extract_strike(symbol)
                if strike and strike_low <= strike <= strike_high:
                    scrip["_parsed_strike"] = strike
                    scrip["_parsed_type"] = "CE" if symbol.endswith("CE") else "PE"
                    relevant_scrips.append(scrip)

            if not relevant_scrips:
                logger.warning(f"[AngelOne] No relevant option scrips after filtering")
                return []

            logger.info(f"[AngelOne] Found {len(relevant_scrips)} option contracts")

            # 6. Fetch full quotes for these tokens (in batches if needed)
            options = []
            index_name = "nifty50" if underlying.upper() == "NIFTY" else \
                         "banknifty" if underlying.upper() == "BANKNIFTY" else \
                         underlying.lower()
            expiry_date = self._get_next_expiry_iso()

            # Process in batches of 50 (API limit)
            batch_size = 50
            for i in range(0, len(relevant_scrips), batch_size):
                batch = relevant_scrips[i:i + batch_size]
                for scrip in batch:
                    token = scrip.get("symboltoken", "")
                    symbol = scrip.get("tradingsymbol", "") or scrip.get("symbol", "")

                    try:
                        quote = self._smart_api.ltpData(
                            exchange=deriv_exchange,
                            tradingsymbol=symbol,
                            symboltoken=token,
                        )

                        ltp_val = 0
                        oi_val = 0
                        volume_val = 0

                        if quote and quote.get("status") and quote.get("data"):
                            qd = quote["data"]
                            ltp_val = float(qd.get("ltp", 0))

                        # Try full quote for OI/volume
                        try:
                            full_quote = self._smart_api.getQuote(
                                exchange=deriv_exchange,
                                tradingsymbol=symbol,
                                symboltoken=token,
                            )
                            if full_quote and full_quote.get("data"):
                                fd = full_quote["data"]
                                oi_val = int(fd.get("opninterest", 0))
                                volume_val = int(fd.get("volume", 0) or fd.get("tradeVolume", 0) or 0)
                                if not ltp_val:
                                    ltp_val = float(fd.get("ltp", 0))
                        except Exception:
                            pass  # OI/volume not available via LTP endpoint

                        options.append({
                            "index": index_name,
                            "strike": scrip["_parsed_strike"],
                            "type": scrip["_parsed_type"],
                            "ltp": round(ltp_val, 2),
                            "oi": oi_val,
                            "volume": volume_val,
                            "change_oi": 0,
                            "iv": 0,
                            "expiry": expiry_date,
                            "symboltoken": token,
                            "tradingsymbol": symbol,
                            "bid": round(ltp_val * 0.99, 2),
                            "ask": round(ltp_val * 1.01, 2),
                            "source": "angelone",
                        })

                    except Exception as e:
                        logger.debug(f"[AngelOne] Quote failed for {symbol}: {e}")

            logger.info(f"[AngelOne] ✅ Fetched {len(options)} option contracts with data")
            return options

        except Exception as e:
            logger.error(f"[AngelOne] Option chain fetch failed: {e}")
            return []

    # ─── Helpers ───────────────────────────────────────────────────

    @staticmethod
    def _extract_strike(symbol: str) -> Optional[int]:
        """Extract strike price from trading symbol like NIFTY13FEB2525000CE."""
        match = re.search(r'(\d+)(CE|PE)$', symbol)
        if match:
            strike_str = match.group(1)
            # Strike might be encoded differently depending on length
            # NIFTY strikes: 5 digits (e.g., 25000)
            # BANKNIFTY strikes: 5 digits (e.g., 53000)
            try:
                return int(strike_str)
            except ValueError:
                return None
        return None

    @staticmethod
    def _get_next_expiry_formatted() -> str:
        """
        Get next weekly expiry date formatted for Angel One search.
        NSE weekly expiry is on Thursday.
        Format: DDMMMYY (e.g., 13FEB26)
        """
        today = datetime.now()
        days_until_thursday = (3 - today.weekday()) % 7
        if days_until_thursday == 0 and today.hour >= 15:
            days_until_thursday = 7
        next_thursday = today + timedelta(days=days_until_thursday)

        day = next_thursday.strftime("%d")
        month = next_thursday.strftime("%b").upper()
        year = next_thursday.strftime("%y")
        return f"{day}{month}{year}"

    @staticmethod
    def _get_next_expiry_iso() -> str:
        """Get next weekly expiry as ISO date string."""
        today = datetime.now()
        days_until_thursday = (3 - today.weekday()) % 7
        if days_until_thursday == 0 and today.hour >= 15:
            days_until_thursday = 7
        next_thursday = today + timedelta(days=days_until_thursday)
        return next_thursday.strftime("%Y-%m-%d")

    def logout(self):
        """Logout and clean up."""
        if self._smart_api and self.is_authenticated:
            try:
                self._smart_api.terminateSession(self._client_id)
                logger.info("[AngelOne] Session terminated")
            except Exception:
                pass
        self._session_data = None
        self._smart_api = None
