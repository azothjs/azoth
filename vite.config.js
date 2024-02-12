import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';

export default defineConfig({
    test: {
        // includeSource: ['src/**/*.{js,ts}'],
        // update: true,
        // timeout: 30_000,
        environment: 'happy-dom',
    },
    plugins: [
        inspect()
    ],
});

