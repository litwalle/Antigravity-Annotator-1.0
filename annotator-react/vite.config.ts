import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: '../annotator-extension',
    emptyOutDir: false,  // 不清空，保留 background.js, manifest.json, icons 等
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    }
  }
})
