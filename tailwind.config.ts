import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/admin/**/*.{js,ts,jsx,tsx,mdx}',
    './components/Admin*.{js,ts,jsx,tsx}',
  ],
  corePlugins: {
    preflight: false, // Don't reset existing site styles
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
