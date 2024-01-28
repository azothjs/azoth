import { defineConfig } from 'vite';
import { resolve } from 'node:path';
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
        target: 'ESNext',
        minify: false,
        outDir: './out',
        lib: {
            // Could also be a dictionary or array of multiple entry points
            // eslint-disable-next-line no-undef
            entry: resolve(__dirname, './src/main.jsx'),
            name: 'Compiled',
            // the proper extensions will be added
            fileName: 'compiled',
        },
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