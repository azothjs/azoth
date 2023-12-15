/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
import { test, expect } from 'vitest';
import acornAz from './acorn-az.js';

const AzParser = Parser.extend(acornAz());
const parse = code => AzParser.parse(code, {
    ecmaVersion: 'latest',
});

test('normal template still works', () => {
    const code = '``';
    expect(parse(code)).toMatchInlineSnapshot(`
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
    `);
});