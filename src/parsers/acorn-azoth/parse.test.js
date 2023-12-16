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

test('normal template with static', () => {
    const code = () => {
        `hello`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      TemplateLiteral
        expressions []
        quasis [
           'hello'
        ]
    `);
});

test('azoth template with static', () => {
    const code = () => {
        _`hello`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      TaggedTemplateExpression
        tag Identifier name: "_",
        quasi TemplateLiteral
          expressions []
          quasis [
             'hello'
          ]
    `);
});