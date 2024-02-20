import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import azothPlugin from '@azoth-web/vite-plugin-azoth';

export default defineConfig({
    plugins: [
        azothPlugin(),
        inspect(),
    ],
    build: {
        sourcemap: true,
    }
});

