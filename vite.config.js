import { defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';

export default defineConfig({
    plugins: [
        myPlugin(),
        Inspect()       
    ],
});

const jsFile = /\.js$/;

function myPlugin() {

    const items = [];

    const transform = {
        name: 'transform-az-plugin',
        enforce: 'pre',
        transform(source, id) {
            if(!jsFile.test(id)) return;
            items.push(id);
            return source.replace(/baa/g, 'banana');
        },

    };

    const injectHtml = {
        name: 'inject-html-plugin',
        enforce: 'post',
        transformIndexHtml(html) {
            return html.replace(
                '<!-- templates -->',
                items.map(item => `<li>${item}</li>`).join('\n')
            );
        },

    };

    return [transform, injectHtml];
}