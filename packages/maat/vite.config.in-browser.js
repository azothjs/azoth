import config from './vite.config.js';
import { mergeConfig } from 'vite';

export default mergeConfig(config, {
    test: {
        browser: {
            headless: false,
        }
    }
});
