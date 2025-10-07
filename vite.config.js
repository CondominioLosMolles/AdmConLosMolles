import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Esta es la línea más importante. Le dice a Vite que todos los
  // archivos se servirán desde el subdirectorio /AdmConLosMolles/
  base: '/AdmConLosMolles/',

  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Esto le dice a Vite que la carpeta de salida se llame 'docs'
    outDir: 'docs',
  },
})

