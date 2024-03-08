import { defineConfig } from 'vite';
// import inspect from 'vite-plugin-inspect';
import azothPlugin from '../vite-plugin/index.js';

export default defineConfig({
    plugins: [
        azothPlugin(),
        // inspect()
    ],
    esbuild: {
    },
    build: {
        target: 'esnext',
        minify: false,
        assetsDir: './assets',
        outDir: 'www',
        modulePreload: false,
        rollupOptions: {
            external: [/^hono/, /^azoth/],
            output: [{
                format: 'es',
                manualChunks: id => {
                    return id
                        .replace(`/Users/marty/dev/azoth-web/azoth/packages/server/`, '')
                        .replaceAll('/', '---');
                    // const splits = id.split('/');
                    // return splits.at(-1);
                },
                chunkFileNames: chunkInfo => {
                    // console.log(chunkInfo);
                    const { name, moduleIds: [virtualName] } = chunkInfo;
                    if(name.startsWith(`_virtual_azoth-templates`)) {
                        const [, params] = virtualName.split('?');
                        console.log(name, params);
                        const [ids] = params.split('&');
                        const [, id] = ids.split('=');
                        return `${id}.html`;
                    }
                    return name.replaceAll('---', '/');
                },
            }],
        },
    },
});
