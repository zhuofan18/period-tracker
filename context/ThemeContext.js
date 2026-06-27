import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  dark: false,
  background: '#ffffff',
  surface:    '#f9f9f9',
  card:       '#ffffff',
  text:       '#111111',
  subtext:    '#666666',
  muted:      '#999999',
  border:     '#e0e0e0',
  inputBg:    '#ffffff',
  inputBorder:'#dddddd',
  placeholder:'#aaaaaa',
  optionBg:   '#f3f3f3',
  primary:    '#e75480',
  primaryLight:'#fde8ef',
  tabBar:     '#ffffff',
  tabBorder:  '#f0f0f0',
};

export const darkTheme = {
  dark: true,
  background: '#0f0f0f',
  surface:    '#1a1a1a',
  card:       '#242424',
  text:       '#f2f2f2',
  subtext:    '#aaaaaa',
  muted:      '#777777',
  border:     '#333333',
  inputBg:    '#242424',
  inputBorder:'#404040',
  placeholder:'#666666',
  optionBg:   '#2e2e2e',
  primary:    '#e75480',
  primaryLight:'#3d1424',
  tabBar:     '#1a1a1a',
  tabBorder:  '#2a2a2a',
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
