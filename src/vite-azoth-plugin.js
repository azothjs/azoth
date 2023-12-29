import { Parser } from 'acorn';
import acornAzothPlugin from './parser';
import { azothGenerate as generate } from './generator';
import { SourceMapGenerator } from 'source-map';
import { normalizePath } from 'vite';

const jsFile = /\.js$/;

export default function AzothPlugin() {

    const AzParser = Parser.extend(acornAzothPlugin());

    const parse = code => AzParser.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // locations: true,
    });
    
    const transpile = (input) => {
        const ast = parse(input);
        const code = generate(ast);
        return code;
    };


    const transform = {
        name: 'rollup-azoth-plugin',
        enforce: 'pre',
        transform(source, id) {
            if(!jsFile.test(id) || !id.includes('src/www/')) return;

            const path = normalizePath(id);
            // const sourceMap = new SourceMapGenerator({ 
            //     file: path.split('/').at(-1)
            // });

            return transpile(source /*, sourceMap*/);
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