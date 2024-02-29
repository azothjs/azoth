import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import azothPlugin from './packages/vite-plugin/index.js'

export default defineConfig({
    test: {
        // includeSource: ['src/**/*.{js,ts}'],
        // update: true,
        timeout: 30_000,
        environment: 'happy-dom',
    },
    plugins: [
        azothPlugin(),
        inspect()
    ],
    esbuild: {
        exclude: '**/*.jsx',
    }
});
