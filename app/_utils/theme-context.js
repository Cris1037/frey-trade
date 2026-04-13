"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  // On mount, read saved preference or fall back to system preference
  useEffect(() => {
    const stored = localStorage.getItem("ft-theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches ? "dark" : "light");

    // Keep in sync with system while no preference is saved
    const handler = (e) => {
      if (!localStorage.getItem("ft-theme")) {
        const next = e.matches ? "dark" : "light";
        setTheme(next);
        document.documentElement.setAttribute("data-theme", next);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Reflect state changes onto the DOM
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("ft-theme", next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
