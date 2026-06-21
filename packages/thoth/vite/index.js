import { compile, templateModule, makeTargets, makeRenderer, makeBind } from '../compiler.js';
import { createFilter } from '@rollup/pluginutils';
import { transform as esbuildTransform } from 'esbuild';
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

    const { include, exclude, extension = /\.[jt]sx$/ } = options;
    const filter = createFilter(include, exclude);

    const programTemplates = new Map();
    const byTarget = new Map();
    const byBind = new Map();

    let config = null;

    const transformJSX = {
        name: 'azoth-jsx',
        enforce: 'pre',
        templates: programTemplates,

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

            // Strip TypeScript from .tsx files, preserving JSX for Thoth
            if(id.endsWith('.tsx')) {
                const result = await esbuildTransform(source, {
                    loader: 'tsx',
                    jsx: 'preserve',
                    sourcefile: path.basename(id),
                });
                source = result.code;
            }

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

        const targetGenerators = new Set();
        const bindGenerators = new Set();

        // Per-site factories: ids repeat in the query (one per call site,
        // source order). The same numbering walk the Transpiler used
        // produces matching export names (t{id}, t{id}_1, …). Each
        // declaration is its own closure — the Rerenderer cache key —
        // while the heavy assets (g, b, template html) stay deduped:
        // the factory line is a one-line manifest of shared parts.
        const siteCounts = new Map();

        const templateExports = ids.map(id => {
            const template = programTemplates.get(id);
            const { targetKey, bindKey, isEmpty } = template;
            if(isEmpty) return '';

            const n = siteCounts.get(id) ?? 0;
            siteCounts.set(id, n + 1);
            const name = n === 0 ? `t${id}` : `t${id}_${n}`;

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

            return `export const ${name} = ${makeRenderer(template, { noContent: isBuild })};\n`;

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
        // Use generateBundle instead of transformIndexHtml to ensure
        // all modules are transformed before injecting templates.
        // This fixes multi-page builds where shared chunks cause
        // templates to be missing from some HTML files.
        // Use generateBundle instead of transformIndexHtml to ensure
        // all modules are transformed before injecting templates.
        // This fixes multi-page builds where shared chunks cause
        // templates to be missing from some HTML files.
        generateBundle(options, bundle) {
            const templateHtml = [...programTemplates.entries()]
                .map(([id, { html }]) => {
                    return `\n    <template id="${id}">${html}</template>`;
                })
                .join('');

            for(const [fileName, asset] of Object.entries(bundle)) {
                if(!fileName.endsWith('.html')) continue;
                if(asset.type !== 'asset') continue;

                const html = asset.source;
                const useBody = !html.includes(TEMPLATE_COMMENT);
                // Match <body> with optional attributes (e.g., <body class="...">)
                const bodyMatch = html.match(/<body[^>]*>/);
                const bodyTag = bodyMatch ? bodyMatch[0] : BODY_START;
                const replace = useBody ? bodyTag : TEMPLATE_COMMENT;
                const replacement = makeReplacement(templateHtml, useBody ? bodyTag : '');
                asset.source = html.replace(replace, replacement);
            }
        },
    };

    return [transformJSX, injectHTML];
}

