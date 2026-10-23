import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// base './' works on GitHub Pages project sites and Vercel alike (hash routing)
export default defineConfig({ plugins: [react()], base: './' })
