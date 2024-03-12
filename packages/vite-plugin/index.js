import { compile, templateModule } from '@azothjs/compiler';
import { createFilter } from '@rollup/pluginutils';
import path from 'node:path';

const resolvedTemplateModule = '\0' + templateModule;

export default function azothPlugin(options) {
    options = options ?? {};

    const { include, exclude, extension = /\.jsx$/ } = options;
    const filter = createFilter(include, exclude);

    const programTemplates = new Map();
    let command = '';

    const transformJSX = {
        name: 'azoth-jsx',
        enforce: 'pre',

        config(config, { command: cmd }) {
            command = cmd;
        },

        resolveId(id) {
            const [name, ids] = id.split('?', 2);
            if(name !== templateModule) return;
            return ids ? `${resolvedTemplateModule}?${ids}` : resolvedTemplateModule;
        },

        load(id) {
            const [name, ids] = id.split('?', 2);
            if(name !== resolvedTemplateModule) return;

            const isBuild = command === 'build';
            const renderer = isBuild ? '__rendererById' : '__makeRenderer';
            const importRenderer = `import { ${renderer} } from 'azoth/runtime';\n`;

            const exports = new URLSearchParams(ids)
                .getAll('id')
                .map(id => {
                    const { html, isDomFragment } = programTemplates.get(id);
                    let exportRender = `\nexport const t${id} = ${renderer}('${id}'`;

                    // html gets added to index.html in build,
                    // but dev mode html is string in virtual module
                    if(!isBuild) exportRender += `, \`${html}\``;

                    // default is false, so only add if true (which is less common)
                    if(isDomFragment) exportRender += ', true';

                    exportRender += `);\n`;
                    return exportRender;
                })
                .join('');

            return importRenderer + exports;
        },

        async transform(source, id) {
            if(!filter(id) || !extension.test(id)) return null;

            let { code, templates, map } = compile(source, {
                generate: { sourceFile: path.basename(id) }
            });

            if(!templates.length) {
                return { code, map: null };
            }

            for(let template of templates) {
                if(programTemplates.has(template.id)) continue;
                programTemplates.set(template.id, template);
            }

            return { code, map };
        }
    };

    const TEMPLATE_COMMENT = '<!--azoth-templates-->';
    const BODY_START = '<body>';
    const makeReplacement = (html, prefix) => `${prefix}\n    <!-- 🚀 azoth templates -->${html}\n    <!-- azoth templates 🌎-->`;

    const injectHTML = {
        name: 'azoth-inject-template-html',
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
