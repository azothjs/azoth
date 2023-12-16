/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
import acornAz from './acorn-az.js';
import { test, expect } from 'vitest';
import addSerializers from './ast-serializers.js';
import '../../utils/code-matchers.js';

const AzParser = Parser.extend(acornAz());
const parse = code => AzParser.parse(code, {
    ecmaVersion: 'latest',
}).body[0].expression;

test('normal template still works', () => {
    const code = '`hello \'${name}\' from ${"world"} & ${x + y} ${[1, 3, 4]}`';
    const ast = parse(code);
    addSerializers(expect, { printLog: false });

    expect(ast).toMatchInlineSnapshot(`
      TemplateLiteral
        expressions [
            name
            "world"
            x + y
            [1, 3, 4]
        ]
        quasis [
           'hello ''
           '' from '
           ' & '
           ' '
           ''
        ]
    `);
});

test('multi line quasi and expression handling', () => {
    const code = () => `
        outer ${ (() => {
        return `inner`;
    })()}!!!
    `;
    const ast = parse(code.toCode());
    addSerializers(expect, { printLog: false });

    expect(ast).toMatchInlineSnapshot(`
      TemplateLiteral
        expressions [
            (() => { ...+2
        ]
        quasis [
           '⏎        outer '
           '!!!⏎    '
        ]
    `);
});
