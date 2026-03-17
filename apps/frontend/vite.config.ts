import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vinext()],
  server: {
    watch: {
      ignored: ["**/node_modules/**", "**/.next/**", "**/.git/**"],
    },
  },
});
