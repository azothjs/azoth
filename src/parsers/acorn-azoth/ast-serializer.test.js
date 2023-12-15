/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
import acornAz from './acorn-az.js';
import { test, expect } from 'vitest';
import { addSerializers } from './ast-serializer.js';

const AzParser = Parser.extend(acornAz());
const parse = code => AzParser.parse(code, {
    ecmaVersion: 'latest',
});

test('normal template still works', () => {
    const code = '`hello ${name} from ${"world"} & ${x + y}`';
    const ast = parse(code); //.body[0].expression;
    
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
                TemplateElement 'hello '
                TemplateElement ' from '
                TemplateElement ' & '
                TemplateElement ''
              ]
        ]
    `);
});

const AST = `
Node {
  "body": [
    Node {
      "end": 2,
      "expression": Node {
        "end": 2,
        "expressions": [],
        "quasis": [
          Node {
            "end": 1,
            "start": 1,
            "tail": true,
            "type": "TemplateElement",
            "value": {
              "cooked": "",
              "raw": "",
            },
          },
        ],
        "start": 0,
        "type": "TemplateLiteral",
      },
      "start": 0,
      "type": "ExpressionStatement",
    },
  ],
  "end": 2,
  "sourceType": "script",
  "start": 0,
  "type": "Program",
}
`;
