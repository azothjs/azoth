import { compile } from 'compiler';
import { createFilter } from '@rollup/pluginutils';

export default function azothPlugin(options) {
    const include = options?.includes;
    const exclude = options?.excludes;
    const extension = options?.extension ?? /\.jsx$/;
    const filter = createFilter(include, exclude);

    const programTemplates = new Map();
    const templateServiceModule = `/templates:`;

    const transform = {
        name: 'rollup-azoth-plugin',
        enforce: 'pre',
        resolveId(id) {
            const [name, ids] = id.split('?', 2);
            if(name !== templateServiceModule) return;
            return id;
        },
        load(id) {
            const [name, ids] = id.split('?', 2);
            if(name !== templateServiceModule) return;

            const renderer = `import { makeRenderer } from 'azoth/dom';\n`;
            const exports = new URLSearchParams(ids)
                .getAll('id')
                .map(id => {
                    const html = programTemplates.get(id);
                    return `\nexport const t${id} = makeRenderer('${id}', \`${html}\`);\n`;
                })
                .join('');

            return renderer + exports;
        },
        transform(source, id) {
            if(!filter(id) || !extension.test(id)) return;

            let { code, templates } = compile(source);

            const moduleTemplates = new Set();

            for(let { id, html } of templates) {
                if(moduleTemplates.has(id)) continue;
                moduleTemplates.add(id, html);
                if(programTemplates.has(id)) continue;
                programTemplates.set(id, html);
            }

            if(!moduleTemplates.size) return;

            const uniqueIds = [...moduleTemplates];
            const params = new URLSearchParams(uniqueIds.map(id => ['id', id]));
            const names = uniqueIds.map(id => `t${id}`).join(', ');

            const imports = [
                `import { __rendererById, __compose } from 'azoth';\n`,
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
            const templateHtml = [...programTemplates.entries()].map(([id, html]) => {
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

function templateService(programTemplates) {
    return {
        name: 'vite-azoth-template-plugin',
        enforce: 'pre',
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
                    const html = programTemplates.get(id);
                    return `\nexport const t${id} = makeRenderer('${id}', \`${html}\`);\n`;
                })
                .join('');

            return renderer + exports;
        },
    }
}