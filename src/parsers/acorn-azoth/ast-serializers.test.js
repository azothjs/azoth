/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
// import acornAz from './acorn-az.js';
import { beforeEach, test } from 'vitest';
import addSerializers from './ast-serializers.js';
import '../../utils/code-matchers.js';
import { toMatchCode } from '../../utils/code-matchers.js';

// const AzParser = Parser.extend(acornAz());
const fullParse = code => Parser.parse(code, {
    ecmaVersion: 'latest',
});
const parse = code => fullParse(code).body[0].expression;

beforeEach(async ({ expect }) => {
    expect.extend(toMatchCode);
    addSerializers(expect, { log: false });
});

test('normal static template', ({ expect }) => {
    const code = '`hello`';
    const ast = fullParse(code);

    expect(ast).toMatchInlineSnapshot(`
      Node {
        "body": [
          Node {
            "end": 7,
            "expression": Node {
              "end": 7,
              "expressions": [],
              "quasis": [
                Node {
                  "end": 6,
                  "start": 1,
                  "tail": true,
                  "type": "TemplateElement",
                  "value": {
                    "cooked": "hello",
                    "raw": "hello",
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
        "end": 7,
        "sourceType": "script",
        "start": 0,
        "type": "Program",
      }
    `);
});

test('normal template still works', ({ expect }) => {
    const code = '`hello \'${name}\' from ${"world"} & ${x + y} ${[1, 3, 4]}`';
    const ast = parse(code);

    expect(ast).toMatchInlineSnapshot(`
      Node {
        "end": 57,
        "expressions": [
          Node {
            "end": 14,
            "name": "name",
            "start": 10,
            "type": "Identifier",
          },
          Node {
            "end": 31,
            "raw": ""world"",
            "start": 24,
            "type": "Literal",
            "value": "world",
          },
          Node {
            "end": 42,
            "left": Node {
              "end": 38,
              "name": "x",
              "start": 37,
              "type": "Identifier",
            },
            "operator": "+",
            "right": Node {
              "end": 42,
              "name": "y",
              "start": 41,
              "type": "Identifier",
            },
            "start": 37,
            "type": "BinaryExpression",
          },
          Node {
            "elements": [
              Node {
                "end": 48,
                "raw": "1",
                "start": 47,
                "type": "Literal",
                "value": 1,
              },
              Node {
                "end": 51,
                "raw": "3",
                "start": 50,
                "type": "Literal",
                "value": 3,
              },
              Node {
                "end": 54,
                "raw": "4",
                "start": 53,
                "type": "Literal",
                "value": 4,
              },
            ],
            "end": 55,
            "start": 46,
            "type": "ArrayExpression",
          },
        ],
        "quasis": [
          Node {
            "end": 8,
            "start": 1,
            "tail": false,
            "type": "TemplateElement",
            "value": {
              "cooked": "hello '",
              "raw": "hello '",
            },
          },
          Node {
            "end": 22,
            "start": 15,
            "tail": false,
            "type": "TemplateElement",
            "value": {
              "cooked": "' from ",
              "raw": "' from ",
            },
          },
          Node {
            "end": 35,
            "start": 32,
            "tail": false,
            "type": "TemplateElement",
            "value": {
              "cooked": " & ",
              "raw": " & ",
            },
          },
          Node {
            "end": 44,
            "start": 43,
            "tail": false,
            "type": "TemplateElement",
            "value": {
              "cooked": " ",
              "raw": " ",
            },
          },
          Node {
            "end": 56,
            "start": 56,
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

test('multi line quasi and expression handling', ({ expect }) => {
    const fn = () => `
        outer ${ (() => {
        return `inner`;
    })()}!!!
    `;
    
    const ast = parse(fn.toCode());

    expect(ast).toMatchInlineSnapshot(`
      Node {
        "end": 61,
        "expressions": [
          Node {
            "arguments": [],
            "callee": Node {
              "async": false,
              "body": Node {
                "body": [
                  Node {
                    "argument": Node {
                      "end": 45,
                      "expressions": [],
                      "quasis": [
                        Node {
                          "end": 44,
                          "start": 39,
                          "tail": true,
                          "type": "TemplateElement",
                          "value": {
                            "cooked": "inner",
                            "raw": "inner",
                          },
                        },
                      ],
                      "start": 38,
                      "type": "TemplateLiteral",
                    },
                    "end": 46,
                    "start": 31,
                    "type": "ReturnStatement",
                  },
                ],
                "end": 48,
                "start": 25,
                "type": "BlockStatement",
              },
              "end": 48,
              "expression": false,
              "generator": false,
              "id": null,
              "params": [],
              "start": 19,
              "type": "ArrowFunctionExpression",
            },
            "end": 51,
            "optional": false,
            "start": 18,
            "type": "CallExpression",
          },
        ],
        "quasis": [
          Node {
            "end": 16,
            "start": 1,
            "tail": false,
            "type": "TemplateElement",
            "value": {
              "cooked": "
              outer ",
              "raw": "
              outer ",
            },
          },
          Node {
            "end": 60,
            "start": 52,
            "tail": true,
            "type": "TemplateElement",
            "value": {
              "cooked": "!!!
          ",
              "raw": "!!!
          ",
            },
          },
        ],
        "start": 0,
        "type": "TemplateLiteral",
      }
    `);
});
