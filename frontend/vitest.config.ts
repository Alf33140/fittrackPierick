// Config Vitest séparée de vite.config.ts pour eviter les conflits de types
// les erreurs TS disparaitront après "npm install" dans le container
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/tests/setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text','html'],
            include: [
                'src/pages/**',
                'src/hooks/**',
                'src/components/**',
                'src/context/**',
            ],
        },
    },
})