import { defineConfig } from 'vite';
import azothPlugin from '../index.js';

export default defineConfig({
    root: './test',
    plugins: [
        azothPlugin(),
    ],
    build: {
        target: 'esnext',
        minify: false,
        outDir: './out',
        assetsDir: './',
        modulePreload: false,
        rollupOptions: {
            output: [{
                format: 'es'
            }]
        },
    },
});