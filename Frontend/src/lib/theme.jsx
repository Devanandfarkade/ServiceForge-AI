import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('serviceforge_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light'; // Default to Light Mode per user requirement
  });

  const [accent, setAccentState] = useState(() => {
    const savedAccent = localStorage.getItem('serviceforge_accent');
    if (['blue', 'teal', 'emerald', 'amber', 'purple'].includes(savedAccent)) {
      return savedAccent;
    }
    return 'blue';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('serviceforge_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', accent);
    localStorage.setItem('serviceforge_accent', accent);
  }, [accent]);

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  const setAccent = (newAccent) => {
    if (['blue', 'teal', 'emerald', 'amber', 'purple'].includes(newAccent)) {
      setAccentState(newAccent);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

