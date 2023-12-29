/* eslint-disable no-undef */
import { Parser } from 'acorn';
import acornAz from '../parser';
import { azothGenerate as generate } from './index.js';
import '../utils/code-matchers.js';
import { describe, it } from 'vitest';
import { SourceMapGenerator } from 'source-map';

const AzParser = Parser.extend(acornAz());

const parse = code => {
    if(code.toBody) code = code.toBody();
    return AzParser.parse(code, {
        ecmaVersion: 'latest',
    });
};

const transpile = input => {
    const ast = parse(input);
    // const sourceMap = new SourceMapGenerator({ file: 'test.js' });
    const code = generate(ast /*, { sourceMap }*/);
    return { code }; //, map: sourceMap };
};

describe.only('generator', () => {

    it('generates from normal ast', ({ expect }) => {
        const t = () => {
            `hello ${place}`;
        }; 

        expect(transpile(t)).toMatchInlineSnapshot(`
          {
            "code": "\`hello \${place}\`;
          ",
          }
        `);
    });

    it('generates static azoth template', ({ expect }) => {
        const t = `#\`<p>azoth</p>\``;

        const { code } = transpile(t);
    
        expect(code).toMatchInlineSnapshot(`
          "(() => {
            const __renderer = __makeRenderer(\`<p>azoth</p>\`);
            const fn = () => {
              return __renderer().__root;
            };
            return fn;
          })();
          "
        `);
    });

    it('generates template with bindings', ({ expect }) => {
        const t = `#\`<p class={category}>{text}</p>\``;

        const { code } = transpile(t);
    
        expect(code).toMatchInlineSnapshot(`
          "(() => {
            const __renderer = __makeRenderer(\`<p data-bind><!--child[0]--></p>\`);
            const fn = () => {
              const { __root, __targets } = __renderer();
              __targets[0].class = category;
              __targets[0].childNodes[0] = text;
              return __root;
            };
            return fn;
          })();
          "
        `);
    });
});
