import { createContext, useContext, useState } from "react";

export const THEMES = {
  dark: {
    bg: "#080B0B",
    bgCard: "#0F1313",
    bgCardHover: "#141919",
    bgSection: "#0C0F0F",
    border: "#1E2828",
    borderHover: "#2E3838",
    text: "#E8EAEA",
    textMuted: "#6B7A7A",
    textDim: "#3A4A4A",
    primary: "#6366F1",
    primaryHover: "#7678F3",
    orange: "#B95F00",
    orangeLight: "#E07810",
    green: "#22C55E",
    label: "#4A5A5A",
    navBg: "rgba(8,11,11,0.92)",
  },
  light: {
    bg: "#F4F5F0",
    bgCard: "#FFFFFF",
    bgCardHover: "#F9FAF7",
    bgSection: "#EEEEE8",
    border: "#DDE0D8",
    borderHover: "#C8CCC4",
    text: "#0F1313",
    textMuted: "#4A5A5A",
    textDim: "#9AA0A0",
    primary: "#6366F1",
    primaryHover: "#4F52D4",
    orange: "#B95F00",
    orangeLight: "#D97010",
    green: "#16A34A",
    label: "#8A9A9A",
    navBg: "rgba(244,245,240,0.92)",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
  return (
    <ThemeContext.Provider value={{ theme, t: THEMES[theme], toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}