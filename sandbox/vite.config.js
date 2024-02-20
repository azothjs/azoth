import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import azothPlugin from '@azoth-web/vite-plugin-azoth';

export default defineConfig({
    esbuild: {
        exclude: '**/*.jsx',
    },
    plugins: [
        azothPlugin(),
        inspect(),
    ],
    build: {
        target: 'esnext',
        sourcemap: true,
    }
});

