// colors.js - Extended Color System
export const colors = {
  // Base colors from reference image
  charcoal: {
    50: "#f6f8fa",
    100: "#e1e7ec",
    200: "#c9d1d9",
    300: "#b1bac4",
    400: "#8b949e",
    500: "#6e7681",
    600: "#484f58",
    700: "#30363d",
    800: "#21262d",
    900: "#161b22",
    950: "#0d1117",
  },

  // Accent gradients (soft, professional)
  green: {
    50: "#f0fff4",
    100: "#dcffe4",
    200: "#bef5cb",
    300: "#85e89d",
    400: "#34d058",
    500: "#28a745",
    600: "#238636",
    700: "#176d2b",
    800: "#165c26",
    900: "#144620",
  },

  blue: {
    50: "#f0f6ff",
    100: "#cae0ff",
    200: "#a5d0ff",
    300: "#79c0ff",
    400: "#58a6ff",
    500: "#388bfd",
    600: "#1f6feb",
    700: "#1158c7",
    800: "#0d419d",
    900: "#0c2d6b",
  },

  // Semantic colors
  semantic: {
    success: {
      light: "#3fb950",
      base: "#238636",
      dark: "#176d2b",
    },
    warning: {
      light: "#d29922",
      base: "#bb8009",
      dark: "#9e6a03",
    },
    error: {
      light: "#f85149",
      base: "#da3633",
      dark: "#b62324",
    },
    info: {
      light: "#58a6ff",
      base: "#1f6feb",
      dark: "#1158c7",
    },
  },

  // Data visualization palette
  data: [
    "#238636", // Primary green
    "#58a6ff", // Blue
    "#f0883e", // Orange
    "#db61a2", // Pink
    "#8957e5", // Purple
    "#6e7681", // Gray
    "#3fb950", // Success green
    "#d29922", // Warning amber
  ],

  // Opacity utilities
  withOpacity: (color, opacity) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
};

export default colors;
