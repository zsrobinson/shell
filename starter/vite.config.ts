import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-query"] },
  optimizeDeps: {
    exclude: ["@zsrobinson/shell"],
    include: [
      "recharts",
      "use-sync-external-store/shim",
      "use-sync-external-store/shim/with-selector",
    ],
  },
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
})
