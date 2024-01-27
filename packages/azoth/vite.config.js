import { defineConfig } from 'vite';


export default defineConfig({
    test: {
        environment: 'jsdom'
        // browser: {
        //     provider: 'webdriverio',
        //     enabled: true,
        //     headless: true,
        //     // name: 'chromium',
        //     name: 'chrome',
        // }
    }
});