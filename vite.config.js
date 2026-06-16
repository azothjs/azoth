/// <reference types="vitest" />
import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import azothPlugin from './packages/vite-plugin/index.js'
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { playwright } from '@vitest/browser-playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dom-info's browser-validation suites probe the pinned Chromium to confirm
// the lifted platform data (props / events / SVG element names) still matches.
// They change only on a dependency or Chromium bump — not on app code — so
// they stay OUT of the default run and CI signal. Run on demand with
// `pnpm test:validate` (e.g. on a dep bump or PR to main).
const validationTests = [
    'packages/dom-info/dom-props.test.js',
    'packages/dom-info/events.test.js',
    'packages/dom-info/svg.test.js',
];
const VALIDATE = process.env.VALIDATE === 'true';

const baseExclude = [
    '**/node_modules/**',
    '**/dist/**',
    // Node-specific tests that can't run in browser
    'packages/jsonic/json-stream.test.js',
    'packages/vite-plugin/index.test.js',
    'vite-test/plugin.test.js',
];

export default defineConfig({
    test: {
        browser: {
            enabled: true,
            headless: true,
            // Playwright manages its own browser binaries (installed via
            // `npx playwright install`). No host-Chrome dependency, no
            // chromedriver version dance.
            instances: [{ browser: 'chromium' }],
            provider: playwright(),
        },
        // VALIDATE: run ONLY the browser-validation suites; otherwise run
        // everything except them.
        ...(VALIDATE
            ? { include: validationTests, exclude: baseExclude }
            : { exclude: [...baseExclude, ...validationTests] }),
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
