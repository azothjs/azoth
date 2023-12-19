/* eslint-disable no-undef */
import { Parser } from 'acorn';
import { test } from 'vitest';
import acornAz from './acorn-az.js';
import addSerializers from './ast-serializers.js';
import '../../utils/code-matchers.js';

const AzParser = Parser.extend(acornAz());

function parse(code) {
    if(code.toBody) code = code.toBody();
    const ast = AzParser.parse(code, {
        ecmaVersion: 'latest',
    });
  
    // remove preamble nodes
    return ast.body[0].expression;
}

addSerializers(expect, { printLog: false });

test('normal template literal', ({ expect }) => {
    const code = () => {
        `hello ${place}`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      TemplateLiteral
        expressions: [
          Identifier
            name: 'place'
        ]
        quasis: [
          'hello '
          ''
        ]
    `);
});

test('azoth template literal', ({ expect }) => {
    const code = () => {
        _`hello ${place}, sum {x + y} blog #{dom}`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      AzothTemplate
        template:   TemplateLiteral
          quasis: [
            'hello '
            ', sum '
            ' blog '
            ''
          ]
          bindings: [
            AzothBinding
              binder: '\${'
              expression: 'place'
            AzothBinding
              binder: '{'
              expression: 'x + y'
            AzothBinding
              binder: '#{'
              expression: 'dom'
          ]
    `);
});