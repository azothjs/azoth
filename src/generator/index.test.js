/* eslint-disable no-undef */
import { Parser } from 'acorn';
import acornAz from '../parsers/acorn-azoth/acorn-az.js';
import { azothGenerate as generate } from './index.js';
import '../utils/code-matchers.js';
import { it } from 'vitest';

const AzParser = Parser.extend(acornAz());

const parse = code => {
    if(code.toBody) code = code.toBody();
    return AzParser.parse(code, {
        ecmaVersion: 'latest',
    });
};

const transpile = code => generate(parse(code));

it('generates from normal ast', ({ expect }) => {
    const code = () => {
        `hello ${place}`;
    }; 

    expect(transpile(code)).toMatchInlineSnapshot(`
      "\`hello \${place}\`;
      "
    `);
});

it('generates from azoth ast static template', ({ expect }) => {
    const code = () => {
        _`<p>hello</p>`;
    }; 

    expect(transpile(code)).toMatchInlineSnapshot(`
      "(() =>
        const __renderer = __makeRenderer(\`<p>hello</p>\`);
        const fn = () =>
          return __renderer();
        };
      )();
      "
    `);
});
