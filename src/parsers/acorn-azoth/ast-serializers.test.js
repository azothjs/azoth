/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
import acornAz from './acorn-az.js';
import { test, expect } from 'vitest';
import addSerializers from './ast-serializers.js';

const AzParser = Parser.extend(acornAz());
const parse = code => AzParser.parse(code, {
    ecmaVersion: 'latest',
});

test('normal template still works', () => {
    const code = '`hello \'${name}\' from ${"world"} & ${x + y}`';
    const ast = parse(code);
    addSerializers(expect);

    expect(ast).toMatchInlineSnapshot(`
      Program
        body[
          ExpressionStatement
            expression: TemplateLiteral
              expressions[
                Identifier name: "name"
                Literal value: "world", raw: ""world""
                BinaryExpression operator: "+"
                  left: Identifier name: "x",
                  right: Identifier name: "y"
              ]
              quasis[
                TemplateElement 'hello ''
                TemplateElement '' from '
                TemplateElement ' & '
                TemplateElement ''
              ]
        ]
    `);
});
