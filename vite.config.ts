import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    strictPort: true, // Fail if port is already in use
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  // Make sure the base path is correct
  base: "",
});
