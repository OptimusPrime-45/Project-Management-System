import { createContext, useContext, useState, useEffect, useMemo } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. Initialize State
    // Check localStorage first, otherwise check the OS system preference
    const [theme, setTheme] = useState(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme) {
            return storedTheme;
        }
        // Check if the user's OS is set to dark mode
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        } else {
            return "light";
        }
    })

    // 2. Effect Hook to update the DOM and LocalStorage
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        // Store the preference in localStorage
        localStorage.setItem("theme", theme);
    }, [theme])

    // 3. Toggle Function
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    }

    const setThemeMode = (nextTheme) => {
        if (nextTheme !== "light" && nextTheme !== "dark") {
            return;
        }
        setTheme(nextTheme);
    }

    const value = useMemo(() => ({ theme, toggleTheme, setThemeMode }), [theme]);

    return (
        <ThemeContext.Provider value={value}> 
            {children}
        </ThemeContext.Provider>
    )
}

// 4. Custom Hook for easy access
export const useTheme = () => useContext(ThemeContext);