import { defineConfig } from 'vite';
import azothPlugin from 'azoth/vite-plugin';

export default defineConfig({
    plugins: [
        azothPlugin(),
    ],
    esbuild: {
        exclude: '**/*.jsx',
    },
    build: {
        target: 'esnext',
        minify: false,
        outDir: './out',
        assetsDir: './',
        modulePreload: false,
        rollupOptions: {
            logLevel: 'debug',
            output: [{
                format: 'es'
            }]
        },
    },
});