import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import azothPlugin from './packages/vite-plugin/index.js'

export default defineConfig({
    test: {
        // includeSource: ['src/**/*.{js,ts}'],
        // update: true,
        timeout: 60_000,
        environment: 'happy-dom',
    },
    plugins: [
        azothPlugin(),
        inspect()
    ],
    build: {
        target: 'esnext',
        sourcemap: true,
    },
    esbuild: {
        exclude: '**/*.jsx',
    }
});
