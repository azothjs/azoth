import { compile } from 'compiler';
import { createFilter } from '@rollup/pluginutils';

// TODO: something better
const templateServiceModule = `/az-tmpl:`;


export default function azothPlugin(options) {
    const include = options?.includes;
    const exclude = options?.excludes;
    const extension = options?.extension ?? /\.jsx$/;
    const filter = createFilter(include, exclude);

    const programTemplates = new Map();
    let command = '';

    const transform = {
        name: 'rollup-azoth-plugin',
        enforce: 'pre',
        config(config, { command: cmd }) {
            command = cmd;
        },
        resolveId(id) {
            const [name, ids] = id.split('?', 2);
            if(name !== templateServiceModule) return;
            return id;
        },
        load(id) {
            const [name, ids] = id.split('?', 2);
            if(name !== templateServiceModule) return;

            const isBuild = command === 'build';
            const renderer = isBuild ? 'rendererById' : 'makeRenderer';

            const importRenderer = `import { ${renderer} } from 'azoth/dom';\n`;
            const exports = new URLSearchParams(ids)
                .getAll('id')
                .map(id => {
                    const { html, isDomFragment } = programTemplates.get(id);
                    let exportRender = `\nexport const t${id} = ${renderer}('${id}'`;
                    // html gets added to index.html in build
                    if(!isBuild) exportRender += `, \`${html}\``;
                    // default is false, so only add if true (which is less common)
                    if(isDomFragment) exportRender += ', true';
                    exportRender += `);\n`;
                    return exportRender;
                })
                .join('');
            return importRenderer + exports;
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
                `import { __compose, __composeElement } from 'azoth';\n`,
                `import { ${names} } from '${templateServiceModule}?${params.toString()}';\n`,
            ].join('');

            return imports + code;

        },
    };

    const injectHtml = {
        name: 'inject-html-plugin',
        apply: 'build',
        enforce: 'post',
        transformIndexHtml(html) {
            const templateHtml = [...programTemplates.entries()].map(([id, { html }]) => {
                return `\n    <template id="${id}">${html}</template>`;
            }).join('');
            return html.replace(
                '<!--azoth-templates-->',
                `<!-- 🚀 azoth templates -->${templateHtml}\n    <!-- azoth templates 🌎-->`,
            );
        },
    };

    return [transform, injectHtml];
}
