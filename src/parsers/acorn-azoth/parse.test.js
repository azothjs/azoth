/* eslint-disable no-undef */
import { Parser } from 'acorn';
import { test, expect } from 'vitest';
import acornAz from './acorn-az.js';
import addSerializers from './ast-serializers.js';
import '../../utils/code-matchers.js';

const AzParser = Parser.extend(acornAz());
const parse = code => {
    if(code?.toCode) code = code.toBody();
    return AzParser.parse(code, {
        ecmaVersion: 'latest',
    }).body[0].expression;
};

addSerializers(expect, { printLog: false });

test('normal template literal', () => {
    const code = () => {
        `hello ${place}`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      TemplateLiteral
        expressions [
          place
        ]
        quasis [
          'hello '
          ''
        ]
    `);
});

test('azoth template literal', () => {
    const code = () => {
        _`hello ${place} {x + y} #{dom}`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      AzothTemplate
        template TemplateLiteral
          expressions [
           \${  place
             {  x + y
            #{  dom
          ]
          quasis [
            'hello '
            ' '
            ' '
            ''
          ]
    `);
});