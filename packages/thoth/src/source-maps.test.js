/* eslint-disable no-undef */
import { compile as _compile } from './index.js';
import { test } from 'vitest';

const compile = input => {
    return _compile(input, {
        generator: { indent: '    ' }
    });
};


test('static one line', ({ expect }) => {
    const input = `const t = <div>Hello World</div>`;
    const { sourceMap, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "const t = tbc5b60ab9f()[0];
      "
    `);
    expect(sourceMap._mappings._array).toMatchInlineSnapshot(`
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

test('{...} one line', ({ expect }) => {
    const input = `<div>Hello {place}</div>`;
    const { sourceMap, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "(() => {
          const __root = ta94b210052()[0];
          const __child0 = __root.childNodes[1];
          __compose(__child0, place);
          return __root;
      })();
      "
    `);
    expect(sourceMap._mappings._array).toMatchInlineSnapshot(`
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
    const { sourceMap, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "const t = te36ec5cf73()[0];
      "
    `);
    expect(sourceMap._mappings._array).toMatchInlineSnapshot(`
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
    const { sourceMap, code } = compile(input);
    expect(code).toMatchInlineSnapshot(`
      "const t = (() => {
          const __root = tf2d718c3f5()[0];
          const __child0 = __root.childNodes[1];
          __compose(__child0, place);
          return __root;
      })();
      "
    `);
    expect(sourceMap._mappings._array).toMatchInlineSnapshot(`
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


function testTrack(code, lineEnd) {
    const state = { line: 1, column: 0 };
    if(code.length > 0) {
        const segments = code.split(lineEnd);
        state.line += (segments.length - 1) * lineEnd.length;
        state.column += segments.at(-1).length;
    }
    return state;
}

test('track \\n', ({ expect }) => {
    // expect(testTrack(`let s = '\n';`, `\n`)).toEqual({ column: 4, line: 1, });
    expect(testTrack(`    `, `\n`)).toEqual({ column: 4, line: 1, });
    expect(testTrack(`\n    `, `\n`)).toEqual({ column: 4, line: 2, });
    expect(testTrack(`    \n`, `\n`)).toEqual({ column: 0, line: 2, });
    expect(testTrack(`    \n    `, `\n`)).toEqual({ column: 4, line: 2, });
    expect(testTrack(`\n\n`, `\n`)).toEqual({ column: 0, line: 3, });
    expect(testTrack(`\n\n    `, `\n`)).toEqual({ column: 4, line: 3, });
    expect(testTrack(`    \n\n    `, `\n`)).toEqual({ column: 4, line: 3, });
    expect(testTrack(`    \n\n`, `\n`)).toEqual({ column: 0, line: 3, });
    expect(testTrack(`\n    \n`, `\n`)).toEqual({ column: 0, line: 3, });
});

test('track \\r\\n', ({ expect }) => {
    expect(testTrack(`    `, `\r\n`)).toEqual({ column: 4, line: 1, });
    expect(testTrack(`\r\n    `, `\r\n`)).toEqual({ column: 4, line: 3, });
    expect(testTrack(`    \r\n`, `\r\n`)).toEqual({ column: 0, line: 3, });
    expect(testTrack(`    \r\n    `, `\r\n`)).toEqual({ column: 4, line: 3, });
    expect(testTrack(`\r\n\r\n`, `\r\n`)).toEqual({ column: 0, line: 5, });
    expect(testTrack(`\r\n\r\n    `, `\r\n`)).toEqual({ column: 4, line: 5, });
    expect(testTrack(`    \r\n\r\n    `, `\r\n`)).toEqual({ column: 4, line: 5, });
    expect(testTrack(`    \r\n\r\n`, `\r\n`)).toEqual({ column: 0, line: 5, });
    expect(testTrack(`\r\n    \r\n`, `\r\n`)).toEqual({ column: 0, line: 5, });
});
