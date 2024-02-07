import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
// import AzothPlugin from './packages/vite-plugin-azoth/vite-azoth-plugin.js';

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

