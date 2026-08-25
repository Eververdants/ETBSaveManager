/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* ===== 色阶 (完整 50-950) ===== */
      colors: {
        neutral: {
          50:  "hsl(var(--neutral-50) / <alpha-value>)",
          100: "hsl(var(--neutral-100) / <alpha-value>)",
          200: "hsl(var(--neutral-200) / <alpha-value>)",
          300: "hsl(var(--neutral-300) / <alpha-value>)",
          400: "hsl(var(--neutral-400) / <alpha-value>)",
          500: "hsl(var(--neutral-500) / <alpha-value>)",
          600: "hsl(var(--neutral-600) / <alpha-value>)",
          700: "hsl(var(--neutral-700) / <alpha-value>)",
          800: "hsl(var(--neutral-800) / <alpha-value>)",
          900: "hsl(var(--neutral-900) / <alpha-value>)",
          950: "hsl(var(--neutral-950) / <alpha-value>)",
        },
        primary: {
          50:  "hsl(var(--primary-50) / <alpha-value>)",
          100: "hsl(var(--primary-100) / <alpha-value>)",
          200: "hsl(var(--primary-200) / <alpha-value>)",
          300: "hsl(var(--primary-300) / <alpha-value>)",
          400: "hsl(var(--primary-400) / <alpha-value>)",
          500: "hsl(var(--primary-500) / <alpha-value>)",
          600: "hsl(var(--primary-600) / <alpha-value>)",
          700: "hsl(var(--primary-700) / <alpha-value>)",
        },
        success: {
          50:  "hsl(var(--success-50) / <alpha-value>)",
          100: "hsl(var(--success-100) / <alpha-value>)",
          200: "hsl(var(--success-200) / <alpha-value>)",
          300: "hsl(var(--success-300) / <alpha-value>)",
          400: "hsl(var(--success-400) / <alpha-value>)",
          500: "hsl(var(--success-500) / <alpha-value>)",
          600: "hsl(var(--success-600) / <alpha-value>)",
        },
        danger: {
          50:  "hsl(var(--danger-50) / <alpha-value>)",
          100: "hsl(var(--danger-100) / <alpha-value>)",
          200: "hsl(var(--danger-200) / <alpha-value>)",
          300: "hsl(var(--danger-300) / <alpha-value>)",
          400: "hsl(var(--danger-400) / <alpha-value>)",
          500: "hsl(var(--danger-500) / <alpha-value>)",
          600: "hsl(var(--danger-600) / <alpha-value>)",
        },

        /* ===== 语义别名 ===== */
        background:   "var(--color-bg-primary)",
        foreground:   "var(--color-text-primary)",
        "bg-secondary":  "var(--color-bg-secondary)",
        "bg-tertiary":   "var(--color-bg-tertiary)",
        "bg-elevated":   "var(--color-bg-elevated)",
        "bg-inverse":    "var(--color-bg-inverse)",
        "bg-muted":      "var(--color-bg-muted)",

        "text-secondary":  "var(--color-text-secondary)",
        "text-tertiary":   "var(--color-text-tertiary)",
        "text-muted":      "var(--color-text-muted)",
        "text-inverse":    "var(--color-text-inverse)",
        "text-link":       "var(--color-text-link)",

        "border-light":   "var(--color-border-light)",
        "border-default": "var(--color-border-default)",
        "border-strong":  "var(--color-border-strong)",
        "border-focus":   "var(--color-border-focus)",

        card: {
          DEFAULT: "var(--color-bg-elevated)",
          foreground: "var(--color-text-primary)",
        },
        muted: {
          DEFAULT: "var(--color-bg-muted)",
          foreground: "var(--color-text-muted)",
        },
        accent: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-fg)",
        },
        destructive: {
          DEFAULT: "var(--color-danger)",
          foreground: "var(--color-danger-fg)",
        },
        ring: "var(--color-ring)",
      },

      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },

      boxShadow: {
        "soft":    "0 1px 3px var(--color-shadow), 0 1px 2px var(--color-shadow)",
        "medium":  "0 4px 12px var(--color-shadow-lg)",
        "strong":  "0 8px 24px var(--color-shadow-lg)",
      },
    },
  },
  plugins: [],
}
