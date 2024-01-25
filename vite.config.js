import { defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';
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
        // update: true,
        // timeout: 30_000,
        // environment: 'jsdom',
    },
    plugins: [
        // AzothPlugin(),
        Inspect()
    ],
});

