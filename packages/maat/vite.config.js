import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        // testTimeout: 30_000,
        browser: {
            headless: false,
        },
        environment: 'happy-dom',
    }
});
