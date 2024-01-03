/* eslint-disable no-undef */
import { Parser } from 'acorn';
import acornAz from '../parser';
import { azothGenerate as generate } from './index.js';
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
    const code = generate(ast, { indent: '    ' });
    return code;
};

describe('regression', () => {
    test('template literal', ({ expect }) => {
        const input = `\`hello \${place}\``;
        expect(compile(input)).toMatchInlineSnapshot(`
          "\`hello \${place}\`;
          "
        `);
    });

    test('tagged template literal', ({ expect }) => {
        const input = `const t = tag\`hello \${place}\``;
        expect(compile(input)).toMatchInlineSnapshot(`
          "const t = tag\`hello \${place}\`;
          "
        `);
    });
});

describe('DomLiteral', () => {
    test('static no bindings', ({ expect }) => {
        const input = `#\`<p>azoth</p>\``;
        expect(compile(input)).toMatchInlineSnapshot(`
          "(() => {
              return __makeRenderer(\`<p-0>azoth</p>\`)().__root;
          })();
          "
        `);
    });

    test('property and child text bindings', ({ expect }) => {
        const input = `#\`<p class={category}>{text}</p>\``;    
        expect(compile(input)).toMatchInlineSnapshot(`
          "(() => {
              const __renderer = __makeRenderer(\`<p-0 data-bind><text-node></text-node></p>\`);
              const { __root, __targets } = __renderer();
              __targets[0].className = category;
              __targets[0].textContent = text;
              return __root;
          })();
          "
        `);
    });

    test('block binding', ({ expect }) => {
        const input = `#\`<div>#{block}</div>\``;    
        expect(compile(input)).toMatchInlineSnapshot(`
          "(() => {
              const __renderer = __makeRenderer(\`<div-0 data-bind><text-node></text-node></div>\`);
              const { __root, __targets } = __renderer();
              new DomBlock(__targets[0], (block));
              return __root;
          })();
          "
        `);
    });


});

describe('surrounding code integration mode', () => {
    test('MODE_IIFE (default)', ({ expect }) => {
        const input = `
            const template = #\`<p>{text}</p>\`
        `;
        expect(compile(input)).toMatchInlineSnapshot(`
          "const template = (() => {
              const __renderer = __makeRenderer(\`<p-0 data-bind><text-node></text-node></p>\`);
              const { __root, __targets } = __renderer();
              __targets[0].textContent = text;
              return __root;
          })();
          "
        `);
    });

    test('MODE_BLOCK: arrow function implicit return', ({ expect }) => {
        const input = `
            const template = (text) => #\`<p>{text}</p>\`
        `;
        expect(compile(input)).toMatchInlineSnapshot(`
          "const template = text => {
              const __renderer = __makeRenderer(\`<p-0 data-bind><text-node></text-node></p>\`);
              const { __root, __targets } = __renderer();
              __targets[0].textContent = text;
              return __root;
          };
          "
        `);
    });

    test('MODE_INLINE: (replace return statement)', ({ expect }) => {
        const input = `
            function template(text) {
                const format = 'text' + '!';
                return #\`<p>{text}</p>\`;
            }
        `;

        expect(compile(input)).toMatchInlineSnapshot(`
          "function template(text) {
              const format = 'text' + '!';
              
              const __renderer = __makeRenderer(\`<p-0 data-bind><text-node></text-node></p>\`);
              const { __root, __targets } = __renderer();
              __targets[0].textContent = text;
              return __root;    
          }
          "
        `);
    });
});
