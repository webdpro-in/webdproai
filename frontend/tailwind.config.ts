import type { Config } from "tailwindcss";

const config: Config = {
   darkMode: ["class"],
   content: [
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
   ],
   theme: {
      extend: {
         colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
               DEFAULT: "hsl(var(--primary))",
               foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
               DEFAULT: "hsl(var(--secondary))",
               foreground: "hsl(var(--secondary-foreground))",
            },
            destructive: {
               DEFAULT: "hsl(var(--destructive))",
               foreground: "hsl(var(--destructive-foreground))",
            },
            muted: {
               DEFAULT: "hsl(var(--muted))",
               foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
               DEFAULT: "hsl(var(--accent))",
               foreground: "hsl(var(--accent-foreground))",
            },
            popover: {
               DEFAULT: "hsl(var(--popover))",
               foreground: "hsl(var(--popover-foreground))",
            },
            card: {
               DEFAULT: "hsl(var(--card))",
               foreground: "hsl(var(--card-foreground))",
            },
            // Premium Brand Colors
            obsidian: {
               DEFAULT: "#0f1115",
               foreground: "#ffffff",
            },
            electric: {
               DEFAULT: "#6366f1", // Indigo 500
               foreground: "#ffffff",
               glow: "rgba(99, 102, 241, 0.5)",
            },
         },
         borderRadius: {
            lg: "var(--radius)",
            md: "calc(var(--radius) - 2px)",
            sm: "calc(var(--radius) - 4px)",
         },
         animation: {
            "fade-in": "fadeIn 0.5s ease-in-out",
            "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            "float": "float 6s ease-in-out infinite",
            "glow": "glow 2s ease-in-out infinite alternate",
            "shimmer": "shimmer 2s linear infinite",
            "progress-indeterminate": "progressIndeterminate 1.5s ease-in-out infinite",
         },
         keyframes: {
            fadeIn: {
               "0%": { opacity: "0" },
               "100%": { opacity: "1" },
            },
            slideUp: {
               "0%": { transform: "translateY(20px)", opacity: "0" },
               "100%": { transform: "translateY(0)", opacity: "1" },
            },
            float: {
               "0%, 100%": { transform: "translateY(0)" },
               "50%": { transform: "translateY(-10px)" },
            },
            glow: {
               "0%": { boxShadow: "0 0 5px var(--primary), 0 0 10px var(--primary)" },
               "100%": { boxShadow: "0 0 20px var(--primary), 0 0 30px var(--primary)" },
            },
            shimmer: {
               "0%": { backgroundPosition: "-200px 0" },
               "100%": { backgroundPosition: "calc(200px + 100%) 0" },
            },
            progressIndeterminate: {
               "0%": { transform: "translateX(-100%)" },
               "100%": { transform: "translateX(400%)" },
            },
         },
         backgroundImage: {
            "premium-gradient": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(280, 85%, 60%) 100%)",
            "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
         }
      },
   },
   plugins: [],
};

export default config;
