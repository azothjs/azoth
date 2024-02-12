import { compile } from '@azoth-web/compiler';
import { createFilter } from '@rollup/pluginutils';

// TODO: something better???
const templateServiceModule = `/az-tmpl:`;

export default function azothPlugin(options) {
    const include = options?.includes;
    const exclude = options?.excludes;
    const extension = options?.extension ?? /\.jsx$/;
    const filter = createFilter(include, exclude);

    const programTemplates = new Map();
    let command = '';

    const transformJSX = {
        name: 'rollup-plugin-azoth',
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
            const renderer = isBuild ? '__rendererById' : '__makeRenderer';
            const importRenderer = `import { ${renderer} } from '@azoth-web/runtime';\n`;

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
            if(!templates.length) {
                return code;
            }

            const moduleTemplates = new Set();
            const importSet = new Set();

            for(let template of templates) {
                const { id, html, needs } = template;
                const { compose, composeElement, createElement } = needs;
                if(compose) importSet.add('__compose');
                if(composeElement) importSet.add('__composeElement');
                if(createElement) importSet.add('__createElement');

                if(!html) continue;

                if(moduleTemplates.has(id)) continue;
                moduleTemplates.add(id);

                if(programTemplates.has(id)) continue;
                programTemplates.set(id, template);
            }

            const imports = [];
            if(importSet.size) {
                imports.push(`import { ${[...importSet].join(', ')} } from '@azoth-web/runtime';\n`);
            }

            if(moduleTemplates.size) {
                const uniqueIds = [...moduleTemplates];
                const params = new URLSearchParams(uniqueIds.map(id => ['id', id]));
                const names = uniqueIds.map(id => `t${id}`).join(', ');
                imports.push(`import { ${names} } from '${templateServiceModule}?${params.toString()}';\n`);
            }

            return imports.join('') + code;
        },
    };

    const TEMPLATE_COMMENT = '<!--azoth-templates-->';
    const BODY_START = '<body>';
    const makeReplacement = (html, prefix) => `${prefix}\n    <!-- 🚀 azoth templates -->${html}\n    <!-- azoth templates 🌎-->`;

    const injectHTML = {
        name: 'vite-plugin-azoth-inject-html',
        apply: 'build',
        enforce: 'post',
        transformIndexHtml(html) {
            const templateHtml = [...programTemplates.entries()]
                .map(([id, { html }]) => {
                    return `\n    <template id="${id}">${html}</template>`;
                })
                .join('');

            const useBody = !html.includes(TEMPLATE_COMMENT);
            const replace = useBody ? BODY_START : TEMPLATE_COMMENT;
            const replacement = makeReplacement(templateHtml, useBody ? BODY_START : '');
            return html.replace(replace, replacement);
        },
    };

    return [transformJSX, injectHTML];
}
