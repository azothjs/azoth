/* eslint-disable no-undef */
import { Parser } from 'acorn';
import { beforeEach, test } from 'vitest';
import acornAz from './acorn-az.js';
import addSerializers from './ast-serializers.js';
import { toMatchCode } from '../../utils/code-matchers.js';

const AzParser = Parser.extend(acornAz());

function parse(code) {
    if(code.toBody) code = code.toBody();
    const ast = AzParser.parse(code, {
        ecmaVersion: 'latest',
    });
  
    // remove preamble nodes
    return ast.body[0].expression;
}

beforeEach(async ({ expect }) => {
    expect.extend(toMatchCode);
    // addSerializers(expect);
});

test('normal template literal', ({ expect }) => {
    const code = () => {
        `hello ${place}`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      Node {
        "end": 16,
        "expressions": [
          Node {
            "end": 14,
            "name": "place",
            "start": 9,
            "type": "Identifier",
          },
        ],
        "quasis": [
          Node {
            "end": 7,
            "start": 1,
            "tail": false,
            "type": "TemplateElement",
            "value": {
              "cooked": "hello ",
              "raw": "hello ",
            },
          },
          Node {
            "end": 15,
            "start": 15,
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
      }
    `);
});

test('azoth template literal', ({ expect }) => {
    const code = () => {
        _`hello ${place}, sum {x + y} blog #{dom}`;
    };

    expect(parse(code)).toMatchInlineSnapshot(`
      Node {
        "end": 42,
        "start": 0,
        "template": Node {
          "bindings": [
            Node {
              "binder": "\${",
              "end": 16,
              "expression": Node {
                "end": 15,
                "name": "place",
                "start": 10,
                "type": "Identifier",
              },
              "start": 8,
              "type": "AzothBinding",
            },
            Node {
              "binder": "{",
              "end": 29,
              "expression": Node {
                "end": 28,
                "left": Node {
                  "end": 24,
                  "name": "x",
                  "start": 23,
                  "type": "Identifier",
                },
                "operator": "+",
                "right": Node {
                  "end": 28,
                  "name": "y",
                  "start": 27,
                  "type": "Identifier",
                },
                "start": 23,
                "type": "BinaryExpression",
              },
              "start": 22,
              "type": "AzothBinding",
            },
            Node {
              "binder": "#{",
              "end": 41,
              "expression": Node {
                "end": 40,
                "name": "dom",
                "start": 37,
                "type": "Identifier",
              },
              "start": 35,
              "type": "AzothBinding",
            },
          ],
          "end": 42,
          "quasis": [
            Node {
              "end": 8,
              "start": 2,
              "tail": false,
              "type": "TemplateElement",
              "value": {
                "cooked": "hello ",
                "raw": "hello ",
              },
            },
            Node {
              "end": 22,
              "start": 16,
              "tail": false,
              "type": "TemplateElement",
              "value": {
                "cooked": ", sum ",
                "raw": ", sum ",
              },
            },
            Node {
              "end": 35,
              "start": 29,
              "tail": false,
              "type": "TemplateElement",
              "value": {
                "cooked": " blog ",
                "raw": " blog ",
              },
            },
            Node {
              "end": 41,
              "start": 41,
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
        "type": "AzothTemplate",
      }
    `);
});