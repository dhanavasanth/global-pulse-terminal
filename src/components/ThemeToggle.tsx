import { Classic } from "@theme-toggles/react";
import "@theme-toggles/react/css/Classic.css";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    // Determine current effective theme (ignoring system generic for toggle visual)
    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

    const toggleTheme = () => {
        // @ts-ignore - viewTransition API
        if (!document.startViewTransition) {
            setTheme(isDark ? "light" : "dark");
            return;
        }

        // @ts-ignore
        document.startViewTransition(() => {
            setTheme(isDark ? "light" : "dark");
        });
    };

    return (
        <button
            onClick={toggleTheme}
            className="rounded-full p-2 hover:bg-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="Toggle theme"
        >
            {/* @ts-ignore - types mismatch with react-aria/related props */}
            <Classic
                duration={750}
                toggled={isDark}
                className="text-2xl"
            />
        </button>
    );
}
