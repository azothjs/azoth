import { defineConfig } from 'vite';
import azothPlugin from '../index.js';

export default defineConfig({
    root: './test',
    plugins: [
        azothPlugin({
            generator: {
                indent: '    '
            }
        }),
    ],
    build: {
        target: 'esnext',
        minify: false,
        outDir: './out',
        assetsDir: './',
        modulePreload: false,
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ['azoth'],
            output: [{
                format: 'es'
            }]
        },
    },
});