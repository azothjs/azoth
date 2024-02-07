import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    exclude: ['./out'],
    // build: {
    //     lib: {
    //         // Could also be a dictionary or array of multiple entry points
    //         // eslint-disable-next-line no-undef
    //         entry: resolve(__dirname, 'index.js'),
    //         name: 'VitePluginAzoth',
    //         formats: ['es'],
    //         // the proper extensions will be added
    //         fileName: 'vite-plugin-azoth',
    //     },
    //     rollupOptions: {
    //         // make sure to externalize deps that shouldn't be bundled
    //         // into your library
    //         external: [
    //             '@rollup/pluginutils',
    //             '@azothjsx/compiler',
    //         ],
    //     },
    // },
});