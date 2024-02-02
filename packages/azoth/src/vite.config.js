import { defineConfig } from 'vite';


export default defineConfig({
    test: {
        environment: 'happy-dom',
        update: true,
        // browser: {
        //     provider: 'webdriverio',
        //     enabled: true,
        //     headless: true,
        //     // name: 'chromium',
        //     name: 'chrome',
        // }
    }
});