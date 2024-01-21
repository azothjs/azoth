import { defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';
import AzothPlugin from './src/vite-azoth-plugin.js';

export default defineConfig({
    // optimizeDeps: {
    //     // esbuildOptions: {
    //     //     jsx: 'preserve',
    //     // },
    //     exclude: ['/templates:?'],
    //     // disabled: true,
    // },
    esbuild: {
        jsx: 'preserve',
    },
    test: {
        // update: true,
        // timeout: 30_000,
        // environment: 'jsdom',
    },
    plugins: [
        AzothPlugin(),
        Inspect()
    ],
});

