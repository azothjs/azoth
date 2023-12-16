/* eslint-disable no-undef */
import { Parser } from 'acorn';
import { test, expect } from 'vitest';
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

test('normal template literal', () => {
    const code = () => {
        `hello ${place}`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      TemplateLiteral 
        expressions: [
          Identifier name='place'
        ]
        quasis: [
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
          quasis: [
            'hello '
            ' '
            ' '
            ''
          ]
          bindings: [
      '\${'
      '{'
      '#{'
          ]
          expressions: [
            Identifier name='place'
            BinaryExpression operator='+'
              left Identifier name='x',
              right Identifier name='y'
            Identifier name='dom'
          ]
    `);
});