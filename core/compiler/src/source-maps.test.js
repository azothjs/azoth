/* eslint-disable no-undef */
import { compile as _compile } from './index.js';
import { test } from 'vitest';

const compile = input => {
    return _compile(input, {
        generate: { indent: '    ' }
    });
};


test('static one line', ({ expect }) => {
    const input = `const t = <div>Hello World</div>`;
    const { map, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "const t = tbc5b60ab9f()[0];
      "
    `);

    expect(map).toMatchInlineSnapshot(`
      {
        "file": "module.jsx",
        "mappings": "MAAMA,IAAI,aAAA",
        "names": [
          "t",
        ],
        "sources": [
          "module.jsx",
        ],
        "version": 3,
      }
    `);
});

test.skip('{...} one line', ({ expect }) => {
    const input = `<div>Hello {place}</div>`;
    const { _sourceMap, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "(() => {
          const __root = ta94b210052()[0];
          const __child0 = __root.childNodes[1];
          __compose(__child0, place);
          return __root;
      })();
      "
    `);
    expect(_sourceMap._mappings._array).toMatchInlineSnapshot(`
      [
        {
          "generatedColumn": 19,
          "generatedLine": 2,
          "name": undefined,
          "originalColumn": 0,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 32,
          "generatedLine": 2,
          "name": undefined,
          "originalColumn": 0,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 21,
          "generatedLine": 3,
          "name": "div",
          "originalColumn": 1,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 38,
          "generatedLine": 3,
          "name": undefined,
          "originalColumn": 11,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 4,
          "generatedLine": 4,
          "name": undefined,
          "originalColumn": 11,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 14,
          "generatedLine": 4,
          "name": undefined,
          "originalColumn": 11,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 24,
          "generatedLine": 4,
          "name": "place",
          "originalColumn": 12,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 11,
          "generatedLine": 5,
          "name": undefined,
          "originalColumn": 0,
          "originalLine": 1,
          "source": "module.jsx",
        },
      ]
    `);
});

test('static three line', ({ expect }) => {
    const input = `const t = <div>
        Hello World
    </div>`;
    const { _sourceMap, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "const t = te36ec5cf73()[0];
      "
    `);
    expect(_sourceMap._mappings._array).toMatchInlineSnapshot(`
      [
        {
          "generatedColumn": 6,
          "generatedLine": 1,
          "name": "t",
          "originalColumn": 6,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 10,
          "generatedLine": 1,
          "name": undefined,
          "originalColumn": 10,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 23,
          "generatedLine": 1,
          "name": undefined,
          "originalColumn": 10,
          "originalLine": 1,
          "source": "module.jsx",
        },
      ]
    `);
});

test('{...} three line', ({ expect }) => {
    const input = `const t = <div>
        Hello {place}
    </div>`;
    const { _sourceMap, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "const t = (() => {
          const __root = tf2d718c3f5()[0];
          const __child0 = __root.childNodes[1];
          __compose(__child0, place);
          return __root;
      })();
      "
    `);
    expect(_sourceMap._mappings._array).toMatchInlineSnapshot(`
      [
        {
          "generatedColumn": 6,
          "generatedLine": 1,
          "name": "t",
          "originalColumn": 6,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 19,
          "generatedLine": 2,
          "name": undefined,
          "originalColumn": 10,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 32,
          "generatedLine": 2,
          "name": undefined,
          "originalColumn": 10,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 21,
          "generatedLine": 3,
          "name": "div",
          "originalColumn": 11,
          "originalLine": 1,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 38,
          "generatedLine": 3,
          "name": undefined,
          "originalColumn": 14,
          "originalLine": 2,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 4,
          "generatedLine": 4,
          "name": undefined,
          "originalColumn": 14,
          "originalLine": 2,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 14,
          "generatedLine": 4,
          "name": undefined,
          "originalColumn": 14,
          "originalLine": 2,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 24,
          "generatedLine": 4,
          "name": "place",
          "originalColumn": 15,
          "originalLine": 2,
          "source": "module.jsx",
        },
        {
          "generatedColumn": 11,
          "generatedLine": 5,
          "name": undefined,
          "originalColumn": 10,
          "originalLine": 1,
          "source": "module.jsx",
        },
      ]
    `);
});
