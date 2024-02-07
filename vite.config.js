import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
// import AzothPlugin from './packages/vite-plugin-azoth/vite-azoth-plugin.js';

export default defineConfig({
    // optimizeDeps: {
    //     esbuildOptions: {
    //         jsx: 'preserve',
    //     },
    // },
    // esbuild: {
    //     jsx: 'preserve',
    // },
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

