import { defineConfig } from 'vite';
import azothPlugin from 'azoth/vite-plugin';

export default defineConfig({
    plugins: [
        azothPlugin(),
    ],
    esbuild: {
        exclude: '**/*.jsx',
    },
    logLevel: 'debug',
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