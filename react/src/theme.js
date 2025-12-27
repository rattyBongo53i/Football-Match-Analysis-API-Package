// theme.js - Centralized Design Tokens
export const theme = {
  // Color Palette (inspired by image)
  colors: {
    // Background layers
    background: {
      primary: "#0f1215", // Deep charcoal
      secondary: "#161b22", // Slightly lighter surface
      tertiary: "#1d2229", // Card backgrounds
      elevated: "#242a33", // Hover states, active items
    },

    // Surface colors
    surface: {
      card: "#1a1f26",
      modal: "#1e242d",
      drawer: "#171c24",
      tooltip: "#242a33",
    },

    // Text hierarchy
    text: {
      primary: "#f0f6fc", // Near-white but softened
      secondary: "#c9d1d9", // Muted gray, highly readable
      tertiary: "#8b949e", // Labels, captions
      muted: "#6e7681", // Disabled, placeholder
      inverse: "#0d1117", // Text on accent
    },

    // Accent colors (muted, professional)
    accent: {
      primary: "#238636", // Muted neon green
      primaryHover: "#2ea043",
      secondary: "#58a6ff", // Soft blue for links
      warning: "#d29922", // Amber for warnings
      error: "#f85149", // Soft red for errors
      success: "#3fb950", // Success green
    },

    // Border colors
    border: {
      light: "#30363d", // Primary borders
      medium: "#21262d", // Subtle dividers
      strong: "#3d444d", // Focus states
    },

    // Interactive states
    state: {
      hover: "rgba(177, 186, 196, 0.12)",
      active: "rgba(177, 186, 196, 0.2)",
      selected: "rgba(56, 139, 253, 0.15)",
      focus: "rgba(56, 139, 253, 0.4)",
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      primary:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'SF Mono', 'Roboto Mono', Consolas, 'Liberation Mono', monospace",
    },

    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },

    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing Scale (8px base unit)
  spacing: {
    0: "0",
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
  },

  // Border Radius
  borderRadius: {
    none: "0",
    sm: "0.25rem", // 4px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
    full: "9999px",
  },

  // Shadows (soft, diffused elevation)
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.25)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -2px rgba(0, 0, 0, 0.25)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.25)",
    focus: "0 0 0 3px rgba(56, 139, 253, 0.4)",
  },

  // Transitions
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Z-index layers
  zIndex: {
    base: 0,
    elevated: 10,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    popover: 400,
    toast: 500,
    tooltip: 600,
  },
};

// Export CSS variables for global usage
export const cssVariables = {
  "--color-bg-primary": theme.colors.background.primary,
  "--color-bg-secondary": theme.colors.background.secondary,
  "--color-bg-tertiary": theme.colors.background.tertiary,
  "--color-surface-card": theme.colors.surface.card,
  "--color-text-primary": theme.colors.text.primary,
  "--color-text-secondary": theme.colors.text.secondary,
  "--color-accent-primary": theme.colors.accent.primary,
  "--color-border-light": theme.colors.border.light,
  "--spacing-4": theme.spacing[4],
  "--border-radius-md": theme.borderRadius.md,
  "--shadow-md": theme.shadows.md,
};

export default theme;

// Add to theme.js

// Enhanced transitions with easing
export const easings = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
};

// Blur and backdrop effects
export const effects = {
  blur: {
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(12px)',
  },
  glassSmall: 'rgba(22, 27, 34, 0.6) backdrop-filter:  blur(10px)',
  glassLarge: 'rgba(22, 27, 34, 0.8) backdrop-filter: blur(12px)',
};

// Elevation/Shadow system
export const elevation = {
  none: '0 0 0 rgba(0, 0, 0, 0)',
  1: '0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1)',
  2: '0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.15)',
  3: '0 8px 16px rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.15)',
  4: '0 12px 24px rgba(0, 0, 0, 0.3), 0 24px 48px rgba(0, 0, 0, 0.2)',
  inset: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
};
