//Original
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(), // Ajoute ceci ici
//   ],
// })

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(),tailwindcss()],
 
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts', 
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['appfittrack-5aw6.onrender.com'],
    // OBLIGATOIRE avec Docker :
    // Par défaut, Vite écoute sur 127.0.0.1 (loopback)
    // Avec 0.0.0.0, il écoute sur toutes les interfaces
    // → accessible depuis l'extérieur du container

    port: 3000,
    // Port du serveur de développement Vite
    watch: {
      usePolling: true,
    },

    proxy: {
      '/api': {
        target: 'http://backend:5000/',
        // "backend" = nom du service Docker Compose
        // Toutes les requêtes /api/* sont redirigées vers Node.js
        changeOrigin: true,
        // Nécessaire pour que le header Host soit correct
      },
    },
  },
})
