import { defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';
import AzothPlugin from './src/vite-azoth-plugin.js';

export default defineConfig({
    test: {
        // update: true,
        // timeout: 30_000,
    },
    plugins: [
        // AzothPlugin(),
        Inspect()       
    ],
});




