import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Warm, mauve-tinted neutrals (instead of flat gray) so they sit
// comfortably alongside the rose/lavender/sage phase palette.
export const lightTheme = {
  dark: false,
  background: '#fffdfb',
  surface:    '#faf5f3',
  card:       '#ffffff',
  text:       '#2a2430',
  subtext:    '#6e6675',
  muted:      '#a79fae',
  border:     '#efe6e9',
  inputBg:    '#ffffff',
  inputBorder:'#e5dade',
  placeholder:'#b7aeb8',
  optionBg:   '#f6f0ee',
  primary:    '#e75480',
  primaryLight:'#fceaf0',
  tabBar:     '#ffffff',
  tabBorder:  '#f1eaec',
};

export const darkTheme = {
  dark: true,
  background: '#15121a',
  surface:    '#1b1720',
  card:       '#231e29',
  text:       '#f2edf3',
  subtext:    '#b3a8b8',
  muted:      '#7c7284',
  border:     '#332c3b',
  inputBg:    '#231e29',
  inputBorder:'#3d3444',
  placeholder:'#655a6c',
  optionBg:   '#2a2430',
  primary:    '#e75480',
  primaryLight:'#3d1a28',
  tabBar:     '#1b1720',
  tabBorder:  '#2c2530',
};

const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = async (value) => {
    const next = value !== undefined ? value : !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
