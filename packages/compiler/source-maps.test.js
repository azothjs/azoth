/* eslint-disable no-undef */
import { compile as _compile } from './compiler.js';
import { test } from 'vitest';

const compile = input => {
    return _compile(input);
};

test('static one line', ({ expect }) => {
    const input = `const t = <div>Hello World</div>`;
    const { code, _sourceMap } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "import { tbc5b60ab9f } from 'virtual:azoth-templates?id=bc5b60ab9f';

      const t = tbc5b60ab9f();
      "
    `);

    expect(_sourceMap._mappings._array).toMatchInlineSnapshot(`
      [
        {
          "generatedColumn": 6,
          "generatedLine": 3,
          "name": "t",
          "originalColumn": 6,
          "originalLine": 1,
          "source": "script.js",
        },
        {
          "generatedColumn": 10,
          "generatedLine": 3,
          "name": undefined,
          "originalColumn": 10,
          "originalLine": 1,
          "source": "script.js",
        },
      ]
    `);
});

test('{...} one line', ({ expect }) => {
    const input = `<div>Hello {place}</div>`;
    const { _sourceMap, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "import { ta94b210052 } from 'virtual:azoth-templates?id=a94b210052';

      ta94b210052(place);
      "
    `);
    expect(_sourceMap._mappings._array).toMatchInlineSnapshot(`
      [
        {
          "generatedColumn": 0,
          "generatedLine": 3,
          "name": undefined,
          "originalColumn": 0,
          "originalLine": 1,
          "source": "script.js",
        },
        {
          "generatedColumn": 12,
          "generatedLine": 3,
          "name": "place",
          "originalColumn": 12,
          "originalLine": 1,
          "source": "script.js",
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
      "import { te36ec5cf73 } from 'virtual:azoth-templates?id=e36ec5cf73';

      const t = te36ec5cf73();
      "
    `);
    expect(_sourceMap._mappings._array).toMatchInlineSnapshot(`
      [
        {
          "generatedColumn": 6,
          "generatedLine": 3,
          "name": "t",
          "originalColumn": 6,
          "originalLine": 1,
          "source": "script.js",
        },
        {
          "generatedColumn": 10,
          "generatedLine": 3,
          "name": undefined,
          "originalColumn": 10,
          "originalLine": 1,
          "source": "script.js",
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
      "import { tf2d718c3f5 } from 'virtual:azoth-templates?id=f2d718c3f5';

      const t = tf2d718c3f5(place);
      "
    `);
    expect(_sourceMap._mappings._array).toMatchInlineSnapshot(`
      [
        {
          "generatedColumn": 6,
          "generatedLine": 3,
          "name": "t",
          "originalColumn": 6,
          "originalLine": 1,
          "source": "script.js",
        },
        {
          "generatedColumn": 10,
          "generatedLine": 3,
          "name": undefined,
          "originalColumn": 10,
          "originalLine": 1,
          "source": "script.js",
        },
        {
          "generatedColumn": 22,
          "generatedLine": 3,
          "name": "place",
          "originalColumn": 15,
          "originalLine": 2,
          "source": "script.js",
        },
      ]
    `);
});
