import { defineConfig } from 'vite';

export default defineConfig({
    exclude: ['./out'],
    optimizeDeps: {
        include: ['@azothjsx/compiler'],
    },
});