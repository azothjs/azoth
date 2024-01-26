import { defineConfig } from 'vite';
import { resolve } from 'path'
import azothPlugin from '../index.js';

console.log('****************', __dirname)

export default defineConfig({
    plugins: [
        azothPlugin(),
    ],
    build: {
        target: 'ESNext',
        minify: false,
        lib: {
            // Could also be a dictionary or array of multiple entry points
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
})