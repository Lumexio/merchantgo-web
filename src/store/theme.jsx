import { createContext, useContext, useState, useEffect } from 'react';
const THEME_KEY = 'merchantgo.theme';
export const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} });
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  const setTheme = (t) => {
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
