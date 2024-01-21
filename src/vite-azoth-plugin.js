import { Parser } from 'acorn';
import acornJsx from 'acorn-jsx';
import { generate } from './new-generator';
// import { normalizePath } from 'vite';

const JSX_TSX = /\.[j|t]sx$/;

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
        resolveId(id) {
            const [name, ids] = id.split('?', 2);
            if(name !== templateServiceModule) return;
            return id;
        },
        load(id) {
            const [name, ids] = id.split('?', 2);
            if(name !== templateServiceModule) return;

            const renderer = `import { makeRenderer } from '/src/azoth/dom';\n`;
            const exports = new URLSearchParams(ids)
                .getAll('id')
                .map(id => {
                    const html = allTemplates.get(id);
                    return `\nlet t${id} = makeRenderer('${id}', \`${html}\`);\n`
                        + `export { t${id} };\n`;
                })
                .join('');

            return renderer + exports;
        },
        transform(source, id) {

            if(!JSX_TSX.test(id) || !id.includes('src/www/')) return;

            // const path = normalizePath(id);
            // const sourceMap = new SourceMapGenerator({ 
            //     file: path.split('/').at(-1)
            // });

            const { code, templates } = transpile(source);

            const unique = new Set();
            for(let { id, html } of templates) {
                if(unique.has(id)) continue;
                unique.add(id, html);
                if(allTemplates.has(id)) continue;
                allTemplates.set(id, html);
            }

            const uniqueIds = [...unique];
            const params = new URLSearchParams(uniqueIds.map(id => ['id', id]));
            const names = uniqueIds.map(id => `t${id}`).join(', ');

            const imports = [
                `\nimport { __rendererById, __compose } from '/src/azoth/index.js';`,
                `\nimport { ${names} } from '${templateServiceModule}?${params.toString()}';`,
                `\n`,
            ];

            return imports.join('') + code;
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
            console.log('transform index html');
            return html.replace(
                '<!-- templates -->',
                `<!-- Azoth templates! -->
                ${templateHtml}`,
            );
        },
    };

    return [transform, injectHtml];
}