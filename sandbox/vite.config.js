import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import azothPlugin from 'vite-plugin-azoth';

export default defineConfig({
    root: 'www',
    plugins: [
        azothPlugin(),
        inspect()
    ],
});

