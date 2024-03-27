import revHash from 'rev-hash';
import { compile, templateModule, makeTargets, makeRenderer, makeBind } from '@azothjs/thoth';
import { createFilter } from '@rollup/pluginutils';
import path from 'node:path';

export const targetModule = `virtual:azoth-target`;
export const bindModule = `virtual:azoth-bind`;
const resolvedTargetModule = '\0' + targetModule;
const resolvedBindModule = '\0' + bindModule;
const resolvedTemplateModule = '\0' + templateModule;

const RESOLVED = {
    [templateModule]: resolvedTemplateModule,
    [targetModule]: resolvedTargetModule,
    [bindModule]: resolvedBindModule,
};

export default function azothPlugin(options) {
    options = options ?? {};

    const { include, exclude, extension = /\.jsx$/ } = options;
    const filter = createFilter(include, exclude);

    const programTemplates = new Map();
    const byTarget = new Map();
    const byBind = new Map();

    let config = null;

    const transformJSX = {
        name: 'azoth-jsx',
        enforce: 'pre',

        configResolved(resolvedConfig) {
            // store the resolved config
            config = resolvedConfig;
        },

        resolveId(id) {
            const [name, ids] = id.split('?', 2);
            const resolved = RESOLVED[name];
            if(!resolved) return;
            return `${resolved}?${ids}`;
        },

        load(id) {
            const [name, params] = id.split('?', 2);
            const isProdBuild = config.mode !== 'test' && config.command === 'build';
            const ids = new URLSearchParams(params).getAll('id');

            switch(name) {
                case resolvedTemplateModule:
                    return loadTemplateModule(ids, isProdBuild);
                case resolvedTargetModule:
                    return loadTargetModule(ids);
                case resolvedBindModule:
                    return loadBindModule(ids);
                default:
                    return;
            }
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

    function loadTargetModule([id]) {
        return `export const g${id} = ${makeTargets(byTarget.get(id))};`;
    }

    function loadBindModule([id]) {
        // TODO: conditionally import based on what was used in templates
        return `import { __c, __cC } from 'azoth/runtime';\nexport const b${id} = ${makeBind(byBind.get(id))};`;
    }

    function loadTemplateModule(ids, isBuild) {
        const moduleImports = [`import { __renderer } from 'azoth/runtime';\n`];

        const templates = ids.map(id => programTemplates.get(id));

        const targetGenerators = new Set();
        const bindGenerators = new Set();

        const templateExports = templates.map(template => {
            const { id, targetKey, bindKey, isEmpty } = template;
            if(isEmpty) return '';

            // TODO: refactor cleanup on this apparent duplication
            if(targetKey) {
                if(!byTarget.has(targetKey)) byTarget.set(targetKey, template);
                if(!targetGenerators.has(targetKey)) {
                    moduleImports.push(`import { g${targetKey} } from '${targetModule}?id=${targetKey}';\n`);
                    targetGenerators.add(targetKey);
                }
            }

            if(bindKey) {
                if(!byBind.has(bindKey)) byBind.set(bindKey, template);
                if(!bindGenerators.has(bindKey)) {
                    moduleImports.push(`import { b${bindKey} } from '${bindModule}?id=${bindKey}';\n`);
                    bindGenerators.add(bindKey);
                }
            }

            return `export const t${id} = ${makeRenderer(template, { noContent: isBuild })};\n`;

        });

        return moduleImports.join('') + templateExports.join('');
    }

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

