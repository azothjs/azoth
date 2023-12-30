/* eslint-disable no-undef */
import { Parser } from 'acorn';
import acornAz from '../parser';
import { azothGenerate as generate } from './index.js';
import '../utils/code-matchers.js';
import { describe, test } from 'vitest';
import { SourceMapGenerator } from 'source-map';

const AzParser = Parser.extend(acornAz());

const parse = code => {
    if(code.toBody) code = code.toBody();
    return AzParser.parse(code, {
        ecmaVersion: 'latest',
    });
};

const compile = input => {
    const ast = parse(input);
    const code = generate(ast);
    return code;
};

describe('generator', () => {

    test('generates from normal ast', ({ expect }) => {
        const input = `\`hello \${place}\``;
        expect(compile(input)).toMatchInlineSnapshot(`
          "\`hello \${place}\`;
          "
        `);
    });

    test('generates static azoth template', ({ expect }) => {
        const input = `#\`<p>azoth</p>\``;
        expect(compile(input)).toMatchInlineSnapshot(`
          "(() => {
            const __renderer = __makeRenderer(\`<p>azoth</p>\`);
            return __renderer().__root;
          })();
          "
        `);
    });

    test('generates template with bindings', ({ expect }) => {
        const input = `#\`<p class={category}>{text}</p>\``;    
        expect(compile(input)).toMatchInlineSnapshot(`
          "(() => {
            const __renderer = __makeRenderer(\`<p data-bind><text-node></text-node></p>\`);
            const { __root, __targets } = __renderer();
            __targets[0].className = category;
            __targets[0].childNodes[0].textContent = text;
            return __root;
          })();
          "
        `);
    });

    describe('surrounding code integration', () => {
        test('default is iife', ({ expect }) => {
            const input = `
                const template = #\`<p>{text}</p>\`
            `;
            expect(compile(input)).toMatchInlineSnapshot(`
              "const template = (() => {
                const __renderer = __makeRenderer(\`<p data-bind><text-node></text-node></p>\`);
                const { __root, __targets } = __renderer();
                __targets[0].childNodes[0].textContent = text;
                return __root;
              })();
              "
            `);
        });

        test('adopts arrow function implicit return', ({ expect }) => {
            const input = `
                const template = (text) => #\`<p>{text}</p>\`
            `;
            expect(compile(input)).toMatchInlineSnapshot(`
              "const template = text => {
                const __renderer = __makeRenderer(\`<p data-bind><text-node></text-node></p>\`);
                const { __root, __targets } = __renderer();
                __targets[0].childNodes[0].textContent = text;
                return __root;
                };
              "
            `);
        });

        test('adopts return statement', ({ expect }) => {
            const input = `
                function template(text) {
                    const format = 'text' + '!';
                    return #\`<p>{text}</p>\`;
                }
            `;
            expect(compile(input)).toMatchInlineSnapshot(`
              "function template(text) {
                const format = 'text' + '!';
                return (() => {
                  const __renderer = __makeRenderer(\`<p data-bind><text-node></text-node></p>\`);
                  const { __root, __targets } = __renderer();
                  __targets[0].childNodes[0].textContent = text;
                  return __root;
                })();
              }
              "
            `);
        });
    });
});