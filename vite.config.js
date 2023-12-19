import { defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';
import AzothPlugin from './src/vite-azoth-plugin.js';

export default defineConfig({
    test: {
        // update: true
    },
    plugins: [
        // AzothPlugin(),
        Inspect()       
    ],
});




