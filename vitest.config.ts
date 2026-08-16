import { defineConfig } from "vitest/config"
import path from "path"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/setupTests.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/server": path.resolve(__dirname, "./node_modules/next/server.js"),
      "next/dist/server/web/spec-extension/request": path.resolve(__dirname, "./node_modules/next/dist/server/web/spec-extension/request.js"),
      "next/dist/server/web/spec-extension/response": path.resolve(__dirname, "./node_modules/next/dist/server/web/spec-extension/response.js"),
      "next/dist/server/web/spec-extension/image-response": path.resolve(__dirname, "./node_modules/next/dist/server/web/spec-extension/image-response.js"),
      "next/dist/server/web/spec-extension/user-agent": path.resolve(__dirname, "./node_modules/next/dist/server/web/spec-extension/user-agent.js"),
      "next/dist/server/web/spec-extension/url-pattern": path.resolve(__dirname, "./node_modules/next/dist/server/web/spec-extension/url-pattern.js"),
    },
  },
})
