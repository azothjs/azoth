import { Parser } from 'acorn';
import acornJsx from 'acorn-jsx';
import { generate } from './new-generator';
// import { normalizePath } from 'vite';

const jsFile = /\.jsx$/;

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

    const transform = {
        name: 'rollup-azoth-plugin',
        enforce: 'pre',
        transform(source, id) {
            console.log('testing...', id);
            if(!jsFile.test(id) || !id.includes('src/www/')) return;

            // const path = normalizePath(id);
            // const sourceMap = new SourceMapGenerator({ 
            //     file: path.split('/').at(-1)
            // });

            const { code, templates } = transpile(source);
            templates.forEach(({ id, html }) => {
                if(allTemplates.has(id)) return;
                allTemplates.set(id, html);
            });

            return code;
        },

    };

    const injectHtml = {
        name: 'inject-html-plugin',
        enforce: 'post',
        transformIndexHtml(html) {
            const templateHtml = [...allTemplates.entries()].map(([id, html]) => {
                return `\n<template id="${id}">${html}</template>`;
            });

            return html.replace(
                '<!-- templates -->',
                templateHtml
            );
        },
    };

    return [transform, injectHtml];
}