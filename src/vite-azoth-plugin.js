import { Parser } from 'acorn';
import acornAz from './parsers/acorn-azoth/acorn-az.js';
import { azothGenerate as generate } from './generator';

const AzParser = Parser.extend(acornAz());

const parse = code => AzParser.parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module'
});

const transpile = code => generate(parse(code));

const jsFile = /\.js$/;

export default function AzothPlugin() {

    const transform = {
        name: 'rollup-azoth-plugin',
        enforce: 'pre',
        transform(source, id) {
            if(!jsFile.test(id)) return;
            return transpile(source);
        },

    };

    return transform;

    // // TODO: inline templates into index.html
    // const injectHtml = {
    //     name: 'inject-html-plugin',
    //     enforce: 'post',
    //     transformIndexHtml(html) {
    //         return html.replace(
    //             '<!-- templates -->',
    //             items.map(item => `<li>${item}</li>`).join('\n')
    //         );
    //     },

    // };
    // return [transform, injectHtml];
}