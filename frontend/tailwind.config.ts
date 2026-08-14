import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF8",
        card: "#FFFFFF",
        ink: "#1C1B19",
        hairline: "#E4E1DA",
        muted: "#8A8578",
        tertiary: "#B7B2A5",
        real: "#2F6B4F",
        fake: "#A13D3D",
        amber: "#B8862F",
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)", "Georgia", "serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        headline: ["clamp(28px, 4.5vw, 42px)", { lineHeight: "1.15" }],
      },
    },
  },
  plugins: [],
};

export default config;
