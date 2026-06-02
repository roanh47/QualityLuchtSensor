import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler']
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'script.js',
        chunkFileNames: 'script.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') return 'style.css'
          return '[name][extname]'
        }
      }
    }
  }
})
