import { Parser } from 'acorn';
import acornJsx from 'acorn-jsx';
import { generate } from '../../src/compile';
// import { normalizePath } from 'vite';

const JSX_EXT = /\.jsx$/;

export default function AzothPlugin() {

    const JsxParser = Parser.extend(acornJsx());

    const parse = code => JsxParser.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module'
        // locations: true,
        // ranges: true,
        // comments: true,
    });

    const transpile = (input) => {
        const ast = parse(input);
        return generate(ast);
    };

    const allTemplates = new Map();

    const templateServiceModule = `/templates:`;

    const transform = {
        name: 'rollup-azoth-plugin',
        enforce: 'pre',
        resolveId(id) {
            // console.log('resolve id', id);

            const [name, ids] = id.split('?', 2);
            if(name !== templateServiceModule) return;
            return id;
        },
        load(id) {
            // console.log('load id', id);
            const [name, ids] = id.split('?', 2);
            if(name !== templateServiceModule) return;

            const renderer = `import { makeRenderer } from '/src/azoth/dom';\n`;
            const exports = new URLSearchParams(ids)
                .getAll('id')
                .map(id => {
                    const html = allTemplates.get(id);
                    return `\nexport const t${id} = makeRenderer('${id}', \`${html}\`);\n`;
                })
                .join('');

            return renderer + exports;
        },
        transform(source, id) {
            if(!JSX_EXT.test(id)) return;
            if(!id.includes('src/www/') && !id.includes('src/azoth/')) return;

            // const path = normalizePath(id);
            // const sourceMap = new SourceMapGenerator({ 
            //     file: path.split('/').at(-1)
            // });

            let { code, templates } = transpile(source);

            const unique = new Set();
            for(let { id, html } of templates) {
                if(unique.has(id)) continue;
                unique.add(id, html);
                if(allTemplates.has(id)) continue;
                allTemplates.set(id, html);
            }

            if(!unique.size) return;

            const uniqueIds = [...unique];
            const params = new URLSearchParams(uniqueIds.map(id => ['id', id]));
            const names = uniqueIds.map(id => `t${id}`).join(', ');

            const imports = [
                `import { __rendererById, __compose } from '/src/azoth/index.js';\n`,
                `import { ${names} } from '${templateServiceModule}?${params.toString()}';\n`,
            ].join('');

            return imports + code;

        },
    };

    // const handleHMR = {
    //     name: 'handle-hmr',
    //     handleHotUpdates(context) {
    //         console.log(context);
    //     }
    // };

    const injectHtml = {
        name: 'inject-html-plugin',
        enforce: 'post',
        transformIndexHtml(html) {
            const templateHtml = [...allTemplates.entries()].map(([id, html]) => {
                return `\n<template id="${id}">${html}</template>`;
            }).join('');
            return html.replace(
                '<!-- templates -->',
                `<!-- Azoth templates! -->
                ${templateHtml}`,
            );
        },
    };

    return [transform]; //, injectHtml];
}