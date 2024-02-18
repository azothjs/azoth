import config from './vite.config.js';
import { mergeConfig } from 'vite';

export default mergeConfig(config, {
    test: {
        // testTimeout: 30_000,
        browser: {
            headless: false,
        }
    }
});
