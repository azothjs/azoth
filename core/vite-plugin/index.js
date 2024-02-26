import { compile } from '../compiler/index.js';
import { createFilter } from '@rollup/pluginutils';
import { SourceNode, SourceMapConsumer } from 'source-map';
import path from 'node:path';

const templateModule = `virtual:azoth-templates`;
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
                generator: { sourceFile: path.basename(id) }
            });

            if(!templates.length) {
                return { code, map: null };
            }

            const moduleTemplates = new Set();
            const importSet = new Set();

            for(let template of templates) {
                const { id, html, imports } = template;

                for(let namedImport of imports) {
                    importSet.add(`__${namedImport}`);
                }

                if(!html) continue;

                if(moduleTemplates.has(id)) continue;
                moduleTemplates.add(id);

                if(programTemplates.has(id)) continue;
                programTemplates.set(id, template);
            }

            const runtimeImports = [];
            if(importSet.size) {
                runtimeImports.push(`import { ${[...importSet].join(', ')} } from 'azoth/runtime';\n`);
            }

            if(moduleTemplates.size) {
                const uniqueIds = [...moduleTemplates];
                const params = new URLSearchParams(uniqueIds.map(id => ['id', id]));
                const names = uniqueIds.map(id => `t${id}`).join(', ');
                runtimeImports.push(`import { ${names} } from '${templateModule}?${params.toString()}';\n`);
            }

            // TODO: find a better way to add imports while maintaining sourcemaps,
            // it shouldn't need to be async...
            if(runtimeImports.length) {
                return SourceMapConsumer.with(
                    map,
                    null,
                    async consumer => {
                        const node = SourceNode.fromStringWithSourceMap(code, consumer);
                        node.prepend(runtimeImports);
                        const { map, code: newCode } = node.toStringWithSourceMap();
                        return {
                            code: newCode,
                            map: map.toJSON()
                        };
                    });
            }

            return { code, map };
        },
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
