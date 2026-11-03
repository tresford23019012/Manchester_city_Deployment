
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import { useColorScheme } from "react-native";

const lightTheme = {
  background: "#FFFFFF",
  surface: "#F5F5F5",
  text: "#222222",
  secondaryText: "#777777",
  primary: "#F58A24",
  border: "#DDDDDD",
  inputBackground: "#FFFFFF",
};

const darkTheme = {
  background: "#121212",
  surface: "#1E1E1E",
  text: "#FFFFFF",
  secondaryText: "#BBBBBB",
  primary: "#F58A24",
  border: "#383838",
  inputBackground: "#2A2A2A",
};

type Theme = typeof lightTheme;

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

//ThemeProvider makes the selected theme available throught the app
export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useColorScheme();

  const [isDark, setIsDark] = useState(deviceScheme === "dark");

  //toggleTheme switches between the two themes
  const toggleTheme = () => {
    setIsDark((previous) => !previous);
  };

  //lightTheme & darkTheme define the app's colors
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{ theme, isDark, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

//useTheme lets any component to access the colors
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
