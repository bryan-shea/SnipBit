import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function copyManifestPlugin(): Plugin {
  return {
    name: 'copy-manifest',
    writeBundle() {
      const distDirectory = resolve(__dirname, 'dist')

      mkdirSync(distDirectory, { recursive: true })
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDirectory, 'manifest.json'))
    },
  }
}

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), copyManifestPlugin()],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        serviceWorker: resolve(__dirname, 'src/background/serviceWorker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'serviceWorker' ? 'assets/serviceWorker.js' : 'assets/[name].js',
        chunkFileNames: 'assets/chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
