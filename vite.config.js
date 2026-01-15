/// <reference types="vitest" />
import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import azothPlugin from './packages/vite-plugin/index.js'
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { webdriverio } from '@vitest/browser-webdriverio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: 'chrome' }],
            provider: webdriverio(),
        },
        // Node-specific tests that can't run in browser
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'packages/jsonic/json-stream.test.js',
            'packages/vite-plugin/index.test.js',
            'vite-test/plugin.test.js',
        ],
    },
    resolve: {
        alias: {
            'test-utils': path.resolve(__dirname, 'test-utils'),
        },
    },
    plugins: [
        azothPlugin(),
        inspect()
    ],
    build: {
        target: 'esnext',
    },
    esbuild: {
        exclude: ['**/*.jsx', '**/*.tsx'],
    }
});
