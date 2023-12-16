/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
// import acornAz from './acorn-az.js';
import { test, expect } from 'vitest';
import addSerializers from './ast-serializers.js';
import '../../utils/code-matchers.js';

// const AzParser = Parser.extend(acornAz());
const fullParse = code => Parser.parse(code, {
    ecmaVersion: 'latest',
});
const parse = code => fullParse(code).body[0].expression;

addSerializers(expect, { log: false });

test('normal static template', () => {
    const code = '`hello`';
    const ast = fullParse(code);

    expect(ast).toMatchInlineSnapshot(`
      Program 
        body: [
          ExpressionStatement 
            expression TemplateLiteral 
              expressions: []
              quasis: [
                'hello'
              ]
        ]
    `);
});

test('normal template still works', () => {
    const code = '`hello \'${name}\' from ${"world"} & ${x + y} ${[1, 3, 4]}`';
    const ast = parse(code);

    expect(ast).toMatchInlineSnapshot(`
      TemplateLiteral 
        expressions: [
          Identifier name='name'
          Literal value='world' raw='"world"'
          BinaryExpression operator='+'
            left Identifier name='x',
            right Identifier name='y'
          ArrayExpression 
            elements: [
              Literal value=1 raw='1'
              Literal value=3 raw='3'
              Literal value=4 raw='4'
            ]
        ]
        quasis: [
          'hello ''
          '' from '
          ' & '
          ' '
          ''
        ]
    `);
});

test('multi line quasi and expression handling', () => {
    const fn = () => `
        outer ${ (() => {
        return `inner`;
    })()}!!!
    `;
    
    const ast = parse(fn.toCode());

    expect(ast).toMatchInlineSnapshot(`
      TemplateLiteral 
        expressions: [
          CallExpression optional=false
            callee ArrowFunctionExpression id=null expression=false generator=false async=false
              body BlockStatement 
                body: [
                  ReturnStatement 
                    argument TemplateLiteral 
                      expressions: []
                      quasis: [
                        'inner'
                      ]
                ]
              params: []
            arguments: []
        ]
        quasis: [
          '⏎        outer '
          '!!!⏎    '
        ]
    `);
});
