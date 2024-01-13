/* eslint-disable no-useless-escape */
import { beforeEach, test } from 'vitest';
import { tokenize } from '.';

const options = { ecmaVersion: 'latest', locations: true, ranges: true };
const getTokens = code => [...tokenize(code, options)]/*.map(
    t => `${t.type.label}: ${t.value ?? ''}`
)*/;

beforeEach(context => {
    context.tokenize = code => context.expect(getTokens(code));
});

test('normal template literal', ({ tokenize }) => {
    tokenize('`a${"b"}c`').toMatchInlineSnapshot(`
      [
        Token {
          "end": 1,
          "loc": SourceLocation {
            "end": Position {
              "column": 1,
              "line": 1,
            },
            "start": Position {
              "column": 0,
              "line": 1,
            },
          },
          "range": [
            0,
            1,
          ],
          "start": 0,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 2,
          "loc": SourceLocation {
            "end": Position {
              "column": 2,
              "line": 1,
            },
            "start": Position {
              "column": 1,
              "line": 1,
            },
          },
          "range": [
            1,
            2,
          ],
          "start": 1,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": "a",
        },
        Token {
          "end": 4,
          "loc": SourceLocation {
            "end": Position {
              "column": 4,
              "line": 1,
            },
            "start": Position {
              "column": 2,
              "line": 1,
            },
          },
          "range": [
            2,
            4,
          ],
          "start": 2,
          "type": TokenType {
            "beforeExpr": true,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\${",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 7,
          "loc": SourceLocation {
            "end": Position {
              "column": 7,
              "line": 1,
            },
            "start": Position {
              "column": 4,
              "line": 1,
            },
          },
          "range": [
            4,
            7,
          ],
          "start": 4,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "string",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": null,
          },
          "value": "b",
        },
        Token {
          "end": 8,
          "loc": SourceLocation {
            "end": Position {
              "column": 8,
              "line": 1,
            },
            "start": Position {
              "column": 7,
              "line": 1,
            },
          },
          "range": [
            7,
            8,
          ],
          "start": 7,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "}",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 9,
          "loc": SourceLocation {
            "end": Position {
              "column": 9,
              "line": 1,
            },
            "start": Position {
              "column": 8,
              "line": 1,
            },
          },
          "range": [
            8,
            9,
          ],
          "start": 8,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": "c",
        },
        Token {
          "end": 10,
          "loc": SourceLocation {
            "end": Position {
              "column": 10,
              "line": 1,
            },
            "start": Position {
              "column": 9,
              "line": 1,
            },
          },
          "range": [
            9,
            10,
          ],
          "start": 9,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
      ]
    `);
});

test('#` is single token', ({ tokenize }) => {
    tokenize('#`<a>...</a>`').toMatchInlineSnapshot(`
      [
        Token {
          "end": 2,
          "loc": SourceLocation {
            "end": Position {
              "column": 2,
              "line": 1,
            },
            "start": Position {
              "column": 0,
              "line": 1,
            },
          },
          "range": [
            0,
            2,
          ],
          "start": 0,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "#\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 12,
          "loc": SourceLocation {
            "end": Position {
              "column": 12,
              "line": 1,
            },
            "start": Position {
              "column": 2,
              "line": 1,
            },
          },
          "range": [
            2,
            12,
          ],
          "start": 2,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": "<a>...</a>",
        },
        Token {
          "end": 13,
          "loc": SourceLocation {
            "end": Position {
              "column": 13,
              "line": 1,
            },
            "start": Position {
              "column": 12,
              "line": 1,
            },
          },
          "range": [
            12,
            13,
          ],
          "start": 12,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
      ]
    `);
});

test('throws SyntaxError: "#" expects "`" as next char', ({ expect }) => {
    expect(() => getTokens('# `hello`')).toThrowErrorMatchingInlineSnapshot(
        `[SyntaxError: Expected "\`" after "#" but found character " " (1:1)]`
    );
});

test('# + block comment + ` okay though, cuz IDE...', ({ tokenize }) => {
    tokenize('#/*html*/`hello`').toMatchInlineSnapshot(`
      [
        Token {
          "end": 10,
          "loc": SourceLocation {
            "end": Position {
              "column": 10,
              "line": 1,
            },
            "start": Position {
              "column": 0,
              "line": 1,
            },
          },
          "range": [
            0,
            10,
          ],
          "start": 0,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "#\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 15,
          "loc": SourceLocation {
            "end": Position {
              "column": 15,
              "line": 1,
            },
            "start": Position {
              "column": 10,
              "line": 1,
            },
          },
          "range": [
            10,
            15,
          ],
          "start": 10,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": "hello",
        },
        Token {
          "end": 16,
          "loc": SourceLocation {
            "end": Position {
              "column": 16,
              "line": 1,
            },
            "start": Position {
              "column": 15,
              "line": 1,
            },
          },
          "range": [
            15,
            16,
          ],
          "start": 15,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
      ]
    `);
});

test('tokenize "${text} #{dom} {smart}" as interpolators', ({ tokenize }) => {
    tokenize('#`<div>${text} #{dom} {smart}</div>`').toMatchInlineSnapshot(`
      [
        Token {
          "end": 2,
          "loc": SourceLocation {
            "end": Position {
              "column": 2,
              "line": 1,
            },
            "start": Position {
              "column": 0,
              "line": 1,
            },
          },
          "range": [
            0,
            2,
          ],
          "start": 0,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "#\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 7,
          "loc": SourceLocation {
            "end": Position {
              "column": 7,
              "line": 1,
            },
            "start": Position {
              "column": 2,
              "line": 1,
            },
          },
          "range": [
            2,
            7,
          ],
          "start": 2,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": "<div>",
        },
        Token {
          "end": 9,
          "loc": SourceLocation {
            "end": Position {
              "column": 9,
              "line": 1,
            },
            "start": Position {
              "column": 7,
              "line": 1,
            },
          },
          "range": [
            7,
            9,
          ],
          "start": 7,
          "type": TokenType {
            "beforeExpr": true,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\${",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 13,
          "loc": SourceLocation {
            "end": Position {
              "column": 13,
              "line": 1,
            },
            "start": Position {
              "column": 9,
              "line": 1,
            },
          },
          "range": [
            9,
            13,
          ],
          "start": 9,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "name",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": "text",
        },
        Token {
          "end": 14,
          "loc": SourceLocation {
            "end": Position {
              "column": 14,
              "line": 1,
            },
            "start": Position {
              "column": 13,
              "line": 1,
            },
          },
          "range": [
            13,
            14,
          ],
          "start": 13,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "}",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 15,
          "loc": SourceLocation {
            "end": Position {
              "column": 15,
              "line": 1,
            },
            "start": Position {
              "column": 14,
              "line": 1,
            },
          },
          "range": [
            14,
            15,
          ],
          "start": 14,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": " ",
        },
        Token {
          "end": 17,
          "loc": SourceLocation {
            "end": Position {
              "column": 17,
              "line": 1,
            },
            "start": Position {
              "column": 15,
              "line": 1,
            },
          },
          "range": [
            15,
            17,
          ],
          "start": 15,
          "type": TokenType {
            "beforeExpr": true,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "#{",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 20,
          "loc": SourceLocation {
            "end": Position {
              "column": 20,
              "line": 1,
            },
            "start": Position {
              "column": 17,
              "line": 1,
            },
          },
          "range": [
            17,
            20,
          ],
          "start": 17,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "name",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": "dom",
        },
        Token {
          "end": 21,
          "loc": SourceLocation {
            "end": Position {
              "column": 21,
              "line": 1,
            },
            "start": Position {
              "column": 20,
              "line": 1,
            },
          },
          "range": [
            20,
            21,
          ],
          "start": 20,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "}",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 22,
          "loc": SourceLocation {
            "end": Position {
              "column": 22,
              "line": 1,
            },
            "start": Position {
              "column": 21,
              "line": 1,
            },
          },
          "range": [
            21,
            22,
          ],
          "start": 21,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": " ",
        },
        Token {
          "end": 23,
          "loc": SourceLocation {
            "end": Position {
              "column": 23,
              "line": 1,
            },
            "start": Position {
              "column": 22,
              "line": 1,
            },
          },
          "range": [
            22,
            23,
          ],
          "start": 22,
          "type": TokenType {
            "beforeExpr": true,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "{",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 28,
          "loc": SourceLocation {
            "end": Position {
              "column": 28,
              "line": 1,
            },
            "start": Position {
              "column": 23,
              "line": 1,
            },
          },
          "range": [
            23,
            28,
          ],
          "start": 23,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "name",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": "smart",
        },
        Token {
          "end": 29,
          "loc": SourceLocation {
            "end": Position {
              "column": 29,
              "line": 1,
            },
            "start": Position {
              "column": 28,
              "line": 1,
            },
          },
          "range": [
            28,
            29,
          ],
          "start": 28,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "}",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 35,
          "loc": SourceLocation {
            "end": Position {
              "column": 35,
              "line": 1,
            },
            "start": Position {
              "column": 29,
              "line": 1,
            },
          },
          "range": [
            29,
            35,
          ],
          "start": 29,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": "</div>",
        },
        Token {
          "end": 36,
          "loc": SourceLocation {
            "end": Position {
              "column": 36,
              "line": 1,
            },
            "start": Position {
              "column": 35,
              "line": 1,
            },
          },
          "range": [
            35,
            36,
          ],
          "start": 35,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
      ]
    `);
});

test('"{" can be escaped', ({ tokenize }) => {
    tokenize('#`hello \\{name}!`').toMatchInlineSnapshot(`
      [
        Token {
          "end": 2,
          "loc": SourceLocation {
            "end": Position {
              "column": 2,
              "line": 1,
            },
            "start": Position {
              "column": 0,
              "line": 1,
            },
          },
          "range": [
            0,
            2,
          ],
          "start": 0,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "#\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 16,
          "loc": SourceLocation {
            "end": Position {
              "column": 16,
              "line": 1,
            },
            "start": Position {
              "column": 2,
              "line": 1,
            },
          },
          "range": [
            2,
            16,
          ],
          "start": 2,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": "hello {name}!",
        },
        Token {
          "end": 17,
          "loc": SourceLocation {
            "end": Position {
              "column": 17,
              "line": 1,
            },
            "start": Position {
              "column": 16,
              "line": 1,
            },
          },
          "range": [
            16,
            17,
          ],
          "start": 16,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
      ]
    `);
});

test('"{" and "#{" not recognized outside of azoth templates', ({ tokenize }) => {
    tokenize('`<div>${text} #{dom} {smart}</div>`').toMatchInlineSnapshot(`
      [
        Token {
          "end": 1,
          "loc": SourceLocation {
            "end": Position {
              "column": 1,
              "line": 1,
            },
            "start": Position {
              "column": 0,
              "line": 1,
            },
          },
          "range": [
            0,
            1,
          ],
          "start": 0,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 6,
          "loc": SourceLocation {
            "end": Position {
              "column": 6,
              "line": 1,
            },
            "start": Position {
              "column": 1,
              "line": 1,
            },
          },
          "range": [
            1,
            6,
          ],
          "start": 1,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": "<div>",
        },
        Token {
          "end": 8,
          "loc": SourceLocation {
            "end": Position {
              "column": 8,
              "line": 1,
            },
            "start": Position {
              "column": 6,
              "line": 1,
            },
          },
          "range": [
            6,
            8,
          ],
          "start": 6,
          "type": TokenType {
            "beforeExpr": true,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\${",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 12,
          "loc": SourceLocation {
            "end": Position {
              "column": 12,
              "line": 1,
            },
            "start": Position {
              "column": 8,
              "line": 1,
            },
          },
          "range": [
            8,
            12,
          ],
          "start": 8,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "name",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": "text",
        },
        Token {
          "end": 13,
          "loc": SourceLocation {
            "end": Position {
              "column": 13,
              "line": 1,
            },
            "start": Position {
              "column": 12,
              "line": 1,
            },
          },
          "range": [
            12,
            13,
          ],
          "start": 12,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "}",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": [Function],
          },
          "value": undefined,
        },
        Token {
          "end": 34,
          "loc": SourceLocation {
            "end": Position {
              "column": 34,
              "line": 1,
            },
            "start": Position {
              "column": 13,
              "line": 1,
            },
          },
          "range": [
            13,
            34,
          ],
          "start": 13,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "template",
            "postfix": false,
            "prefix": false,
            "startsExpr": false,
            "updateContext": null,
          },
          "value": " #{dom} {smart}</div>",
        },
        Token {
          "end": 35,
          "loc": SourceLocation {
            "end": Position {
              "column": 35,
              "line": 1,
            },
            "start": Position {
              "column": 34,
              "line": 1,
            },
          },
          "range": [
            34,
            35,
          ],
          "start": 34,
          "type": TokenType {
            "beforeExpr": false,
            "binop": null,
            "isAssign": false,
            "isLoop": false,
            "keyword": undefined,
            "label": "\`",
            "postfix": false,
            "prefix": false,
            "startsExpr": true,
            "updateContext": [Function],
          },
          "value": undefined,
        },
      ]
    `);
});

test('invalid template still reads on invalid escape sequence', ({ tokenize }) => {
    tokenize('#`a\\uone${1}a\\utwo#{2}a\\uthree{3}a\\ufour`')
        .toMatchInlineSnapshot(`
          [
            Token {
              "end": 2,
              "loc": SourceLocation {
                "end": Position {
                  "column": 2,
                  "line": 1,
                },
                "start": Position {
                  "column": 0,
                  "line": 1,
                },
              },
              "range": [
                0,
                2,
              ],
              "start": 0,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "#\`",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 8,
              "loc": SourceLocation {
                "end": Position {
                  "column": 8,
                  "line": 1,
                },
                "start": Position {
                  "column": 2,
                  "line": 1,
                },
              },
              "range": [
                2,
                8,
              ],
              "start": 2,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "invalidTemplate",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": null,
              },
              "value": "a\\uone",
            },
            Token {
              "end": 10,
              "loc": SourceLocation {
                "end": Position {
                  "column": 10,
                  "line": 1,
                },
                "start": Position {
                  "column": 8,
                  "line": 1,
                },
              },
              "range": [
                8,
                10,
              ],
              "start": 8,
              "type": TokenType {
                "beforeExpr": true,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "\${",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 11,
              "loc": SourceLocation {
                "end": Position {
                  "column": 11,
                  "line": 1,
                },
                "start": Position {
                  "column": 10,
                  "line": 1,
                },
              },
              "range": [
                10,
                11,
              ],
              "start": 10,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "num",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": null,
              },
              "value": 1,
            },
            Token {
              "end": 12,
              "loc": SourceLocation {
                "end": Position {
                  "column": 12,
                  "line": 1,
                },
                "start": Position {
                  "column": 11,
                  "line": 1,
                },
              },
              "range": [
                11,
                12,
              ],
              "start": 11,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "}",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 18,
              "loc": SourceLocation {
                "end": Position {
                  "column": 18,
                  "line": 1,
                },
                "start": Position {
                  "column": 12,
                  "line": 1,
                },
              },
              "range": [
                12,
                18,
              ],
              "start": 12,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "invalidTemplate",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": null,
              },
              "value": "a\\utwo",
            },
            Token {
              "end": 20,
              "loc": SourceLocation {
                "end": Position {
                  "column": 20,
                  "line": 1,
                },
                "start": Position {
                  "column": 18,
                  "line": 1,
                },
              },
              "range": [
                18,
                20,
              ],
              "start": 18,
              "type": TokenType {
                "beforeExpr": true,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "#{",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 21,
              "loc": SourceLocation {
                "end": Position {
                  "column": 21,
                  "line": 1,
                },
                "start": Position {
                  "column": 20,
                  "line": 1,
                },
              },
              "range": [
                20,
                21,
              ],
              "start": 20,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "num",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": null,
              },
              "value": 2,
            },
            Token {
              "end": 22,
              "loc": SourceLocation {
                "end": Position {
                  "column": 22,
                  "line": 1,
                },
                "start": Position {
                  "column": 21,
                  "line": 1,
                },
              },
              "range": [
                21,
                22,
              ],
              "start": 21,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "}",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 30,
              "loc": SourceLocation {
                "end": Position {
                  "column": 30,
                  "line": 1,
                },
                "start": Position {
                  "column": 22,
                  "line": 1,
                },
              },
              "range": [
                22,
                30,
              ],
              "start": 22,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "invalidTemplate",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": null,
              },
              "value": "a\\uthree",
            },
            Token {
              "end": 31,
              "loc": SourceLocation {
                "end": Position {
                  "column": 31,
                  "line": 1,
                },
                "start": Position {
                  "column": 30,
                  "line": 1,
                },
              },
              "range": [
                30,
                31,
              ],
              "start": 30,
              "type": TokenType {
                "beforeExpr": true,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "{",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 32,
              "loc": SourceLocation {
                "end": Position {
                  "column": 32,
                  "line": 1,
                },
                "start": Position {
                  "column": 31,
                  "line": 1,
                },
              },
              "range": [
                31,
                32,
              ],
              "start": 31,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "num",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": null,
              },
              "value": 3,
            },
            Token {
              "end": 33,
              "loc": SourceLocation {
                "end": Position {
                  "column": 33,
                  "line": 1,
                },
                "start": Position {
                  "column": 32,
                  "line": 1,
                },
              },
              "range": [
                32,
                33,
              ],
              "start": 32,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "}",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 40,
              "loc": SourceLocation {
                "end": Position {
                  "column": 40,
                  "line": 1,
                },
                "start": Position {
                  "column": 33,
                  "line": 1,
                },
              },
              "range": [
                33,
                40,
              ],
              "start": 33,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "invalidTemplate",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": null,
              },
              "value": "a\\ufour",
            },
            Token {
              "end": 41,
              "loc": SourceLocation {
                "end": Position {
                  "column": 41,
                  "line": 1,
                },
                "start": Position {
                  "column": 40,
                  "line": 1,
                },
              },
              "range": [
                40,
                41,
              ],
              "start": 40,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "\`",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": [Function],
              },
              "value": undefined,
            },
          ]
        `);
});

test('invalid template still reads on normal template', ({ tokenize }) => {
    tokenize('`a\\uone${1}a\\utwo#{2}a\\uthree{3}a\\ufour`')
        .toMatchInlineSnapshot(`
          [
            Token {
              "end": 1,
              "loc": SourceLocation {
                "end": Position {
                  "column": 1,
                  "line": 1,
                },
                "start": Position {
                  "column": 0,
                  "line": 1,
                },
              },
              "range": [
                0,
                1,
              ],
              "start": 0,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "\`",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 7,
              "loc": SourceLocation {
                "end": Position {
                  "column": 7,
                  "line": 1,
                },
                "start": Position {
                  "column": 1,
                  "line": 1,
                },
              },
              "range": [
                1,
                7,
              ],
              "start": 1,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "invalidTemplate",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": null,
              },
              "value": "a\\uone",
            },
            Token {
              "end": 9,
              "loc": SourceLocation {
                "end": Position {
                  "column": 9,
                  "line": 1,
                },
                "start": Position {
                  "column": 7,
                  "line": 1,
                },
              },
              "range": [
                7,
                9,
              ],
              "start": 7,
              "type": TokenType {
                "beforeExpr": true,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "\${",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 10,
              "loc": SourceLocation {
                "end": Position {
                  "column": 10,
                  "line": 1,
                },
                "start": Position {
                  "column": 9,
                  "line": 1,
                },
              },
              "range": [
                9,
                10,
              ],
              "start": 9,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "num",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": null,
              },
              "value": 1,
            },
            Token {
              "end": 11,
              "loc": SourceLocation {
                "end": Position {
                  "column": 11,
                  "line": 1,
                },
                "start": Position {
                  "column": 10,
                  "line": 1,
                },
              },
              "range": [
                10,
                11,
              ],
              "start": 10,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "}",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": [Function],
              },
              "value": undefined,
            },
            Token {
              "end": 39,
              "loc": SourceLocation {
                "end": Position {
                  "column": 39,
                  "line": 1,
                },
                "start": Position {
                  "column": 11,
                  "line": 1,
                },
              },
              "range": [
                11,
                39,
              ],
              "start": 11,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "invalidTemplate",
                "postfix": false,
                "prefix": false,
                "startsExpr": false,
                "updateContext": null,
              },
              "value": "a\\utwo#{2}a\\uthree{3}a\\ufour",
            },
            Token {
              "end": 40,
              "loc": SourceLocation {
                "end": Position {
                  "column": 40,
                  "line": 1,
                },
                "start": Position {
                  "column": 39,
                  "line": 1,
                },
              },
              "range": [
                39,
                40,
              ],
              "start": 39,
              "type": TokenType {
                "beforeExpr": false,
                "binop": null,
                "isAssign": false,
                "isLoop": false,
                "keyword": undefined,
                "label": "\`",
                "postfix": false,
                "prefix": false,
                "startsExpr": true,
                "updateContext": [Function],
              },
              "value": undefined,
            },
          ]
        `);
});
