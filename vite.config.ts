import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { resolve } from "path"

const IS_DEV = process.env.NODE_ENV === "development"

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "~": resolve(__dirname, "."),
    },
  },
  build: {
    watch: IS_DEV ? {} : undefined,
    sourcemap: IS_DEV ? "inline" : false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/ui/popup/index.html"),
      },
    },
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },
})