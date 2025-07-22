import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import path from "path"

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "BugReporter",
      fileName: (format) => {
        if (format === "es") return "index.mjs"
        if (format === "cjs") return "index.cjs"
        return "index.umd.js"
      },
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      external: ["html2canvas"],
      output: {
        globals: {
          html2canvas: "html2canvas",
        },
      },
    },
  },
  plugins: [dts()],
})
