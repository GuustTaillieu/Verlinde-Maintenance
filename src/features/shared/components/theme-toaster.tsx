import { Toaster, type ToasterProps } from "sonner";
import { useEffect, useState } from "react";

export function ThemeToaster(props: ToasterProps) {
    const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

    useEffect(() => {
        // Sync with your theme strategy (e.g., Tailwind class selector)
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");

        // Optional: Observe theme changes dynamically if your application modifies document attributes
        const observer = new MutationObserver(() => {
            const isDarkNow = document.documentElement.classList.contains("dark");
            setTheme(isDarkNow ? "dark" : "light");
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <Toaster theme={theme} {...props} />
    );
}
