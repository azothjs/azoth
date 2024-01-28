import { compile } from 'compiler';
import { createFilter } from '@rollup/pluginutils';

// TODO: something better
const templateServiceModule = `/templates:`;


export default function azothPlugin(options) {
    const include = options?.includes;
    const exclude = options?.excludes;
    const extension = options?.extension ?? /\.jsx$/;
    const filter = createFilter(include, exclude);

    const programTemplates = new Map();

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
                    const { html, isDomFragment } = programTemplates.get(id);
                    // default is false, so only add if true (which is less common)
                    const isFragParam = isDomFragment ? ', true' : '';
                    return `\nexport const t${id} = makeRenderer('${id}', \`${html}\`${isFragParam});\n`;
                })
                .join('');

            return renderer + exports;
        },
        transform(source, id) {
            if(!filter(id) || !extension.test(id)) return;

            let { code, templates } = compile(source, options);

            const moduleTemplates = new Set();

            for(let template of templates) {
                const { id } = template;
                if(moduleTemplates.has(id)) continue;
                moduleTemplates.add(id);

                if(programTemplates.has(id)) continue;
                programTemplates.set(id, template);
            }

            if(!moduleTemplates.size) return;

            const uniqueIds = [...moduleTemplates];
            const params = new URLSearchParams(uniqueIds.map(id => ['id', id]));
            const names = uniqueIds.map(id => `t${id}`).join(', ');

            const imports = [
                `import { __compose } from 'azoth';\n`,
                `import { ${names} } from '${templateServiceModule}?${params.toString()}';\n`,
            ].join('');

            return imports + code;

        },
    };

    const injectHtml = {
        name: 'inject-html-plugin',
        enforce: 'post',
        transformIndexHtml(html) {
            const templateHtml = [...programTemplates.entries()].map(([id, { html }]) => {
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
    };
}