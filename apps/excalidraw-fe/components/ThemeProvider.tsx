"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";
type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  themes?: string[];
};

type ThemeProviderState = {
  theme: Theme;
  activeTheme?: string;
  setTheme: (theme: Theme) => void;
  setActiveTheme: (theme: string) => void;
  themes: string[];
};

const initialState: ThemeProviderState = {
  theme: "system",
  activeTheme: "blue",
  setTheme: () => null,
  setActiveTheme: () => null,
  themes: ["blue", "purple", "green", "red"],
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  themes = ["blue", "purple", "green", "red"],
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [activeTheme, setActiveTheme] = useState<string>(themes[0]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove("light", "dark");
    
    // Remove all theme variations
    themes.forEach((t) => {
      root.classList.remove(`theme-${t}`);
    });

    // Apply new theme
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Apply theme variation
    root.classList.add(`theme-${activeTheme}`);
    
    // Store preference in localStorage
    window.localStorage.setItem("theme", theme);
    window.localStorage.setItem("activeTheme", activeTheme);
  }, [theme, activeTheme, themes]);

  // Initialize from localStorage on client side
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme") as Theme;
    const storedActiveTheme = window.localStorage.getItem("activeTheme");
    
    if (storedTheme) {
      setTheme(storedTheme);
    }
    
    if (storedActiveTheme && themes.includes(storedActiveTheme)) {
      setActiveTheme(storedActiveTheme);
    }
  }, [themes]);

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        activeTheme,
        setTheme,
        setActiveTheme,
        themes,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md transition-colors hover:bg-muted/50 focus:outline-none"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">
        <div className={`absolute transition-all duration-300 ease-in-out ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}>
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        </div>
        <div className={`absolute transition-all duration-300 ease-in-out ${theme === 'light' ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}>
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        </div>
      </div>
    </button>
  );
}

export function ThemeSelector() {
  const { themes, activeTheme, setActiveTheme } = useTheme();
  
  return (
    <div className="flex items-center space-x-2">
      {themes.map((theme) => (
        <button
          key={theme}
          onClick={() => setActiveTheme(theme)}
          className={`h-6 w-6 rounded-full transition-all ${
            activeTheme === theme ? 'ring-2 ring-primary' : ''
          }`}
          style={{ backgroundColor: `var(--theme-${theme})` }}
          aria-label={`Switch to ${theme} theme`}
        />
      ))}
    </div>
  );
} 