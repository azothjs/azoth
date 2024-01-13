import { beforeEach, describe, test, } from 'vitest';
import { Parser as AcornParser } from 'acorn';
import azoth from './index.js';
import espree from 'espree/lib/espree.js';
import { diff, diffStringsUnified, diffLinesRaw } from 'jest-diff';
import { addSerializers } from './serializers.js';

const defaultOptions = { 
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
    ranges: true,

};
const AzothParser = AcornParser.extend(azoth());
const AzothEspreeParser = AcornParser.extend(azoth(), espree());
const parse = code => {
    const tokens = [];
    const ast = AzothParser.parse(code, { 
        ...defaultOptions, 
        onToken: tokens 
    });
    const espree = AzothEspreeParser.parse(code, {
        ...defaultOptions,
        loc: true,
        range: true,
        tokens: true,
    });
    const { tokens: espreeTokens } = espree;
    delete espree.tokens;
    return {
        azoth: { ast, tokens },
        espree: { ast: espree, tokens: espreeTokens }
    };
};

const noColor = string => string;

const options = {
    aColor: noColor,
    bColor: noColor,
    changeColor: noColor,
    commonColor: noColor,
    patchColor: noColor,
    commonLineTrailingSpaceColor: noColor,
    changeLineTrailingSpaceColor: noColor,
    contextLines: 2,
    expand: false,  
    includeChangeCounts: true,
//   omitAnnotationLines: true,
};


describe('parser comparison', () => {
    beforeEach(({ expect }) => addSerializers(expect, { 
        constructors: ['Token'],
        types: ['Template']
    }));
    
    test('ast template location differences', ({ expect }) => {
        const { azoth, espree } = parse(`\`hello \${"world"}\``);
        const ast = diff(espree.ast, azoth.ast, options);
        expect(ast).toMatchInlineSnapshot(`
          "- Expected  - 12
          + Received  + 12

          @@ -40,20 +40,20 @@
                    "quasis": Array [
                      Node {
          -             "end": 9,
          +             "end": 7,
                        "loc": SourceLocation {
                          "end": Position {
          -                 "column": 9,
          +                 "column": 7,
                            "line": 1,
                          },
                          "start": Position {
          -                 "column": 0,
          +                 "column": 1,
                            "line": 1,
                          },
                        },
                        "range": Array [
          -               0,
          -               9,
          +               1,
          +               7,
                        ],
          -             "start": 0,
          +             "start": 1,
                        "tail": false,
                        "type": "TemplateElement",
          @@ -64,20 +64,20 @@
                      },
                      Node {
          -             "end": 18,
          +             "end": 17,
                        "loc": SourceLocation {
                          "end": Position {
          -                 "column": 18,
          +                 "column": 17,
                            "line": 1,
                          },
                          "start": Position {
          -                 "column": 16,
          +                 "column": 17,
                            "line": 1,
                          },
                        },
                        "range": Array [
          -               16,
          -               18,
          +               17,
          +               17,
                        ],
          -             "start": 16,
          +             "start": 17,
                        "tail": true,
                        "type": "TemplateElement","
        `);

        
    });

    test('token differences', ({ expect }) => {
        const { azoth, espree } = parse(`\`hello \${"world"}\``);
        const tokens = diff(espree.tokens, azoth.tokens, options);
        expect(espree.tokens).toMatchInlineSnapshot(`
          [
            { "type": "Template", "value": "\`hello \${ ", "loc": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 9 } }, "start": 0, "end": 9, "range": [0, 9] },
            { "type": "String", "value": "\\"world\\"", "start": 9, "end": 16, "loc": { "start": { "line": 1, "column": 9 }, "end": { "line": 1, "column": 16 } }, "range": [9, 16] },
            { "type": "Template", "value": " }\`", "loc": { "start": { "line": 1, "column": 16 }, "end": { "line": 1, "column": 18 } }, "start": 16, "end": 18, "range": [16, 18] },
          ]
        `);

        expect(azoth.tokens).toMatchInlineSnapshot(`
          [
            { "type": { "label": "\`", "beforeExpr": false, "startsExpr": true, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null }, "start": 0, "end": 1, "loc": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 1 } }, "range": [0, 1] },
            { "type": { "label": "template", "beforeExpr": false, "startsExpr": false, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null, "updateContext": null }, "value": "hello ", "start": 1, "end": 7, "loc": { "start": { "line": 1, "column": 1 }, "end": { "line": 1, "column": 7 } }, "range": [1, 7] },
            { "type": { "label": "\${ ", "beforeExpr": true, "startsExpr": true, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null }, "start": 7, "end": 9, "loc": { "start": { "line": 1, "column": 7 }, "end": { "line": 1, "column": 9 } }, "range": [7, 9] },
            { "type": { "label": "string", "beforeExpr": false, "startsExpr": true, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null, "updateContext": null }, "value": "world", "start": 9, "end": 16, "loc": { "start": { "line": 1, "column": 9 }, "end": { "line": 1, "column": 16 } }, "range": [9, 16] },
            { "type": { "label": " }", "beforeExpr": false, "startsExpr": false, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null }, "start": 16, "end": 17, "loc": { "start": { "line": 1, "column": 16 }, "end": { "line": 1, "column": 17 } }, "range": [16, 17] },
            { "type": { "label": "template", "beforeExpr": false, "startsExpr": false, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null, "updateContext": null }, "value": "", "start": 17, "end": 17, "loc": { "start": { "line": 1, "column": 17 }, "end": { "line": 1, "column": 17 } }, "range": [17, 17] },
            { "type": { "label": "\`", "beforeExpr": false, "startsExpr": true, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null }, "start": 17, "end": 18, "loc": { "start": { "line": 1, "column": 17 }, "end": { "line": 1, "column": 18 } }, "range": [17, 18] },
            { "type": { "label": "eof", "beforeExpr": false, "startsExpr": false, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null, "updateContext": null }, "start": 18, "end": 18, "loc": { "start": { "line": 1, "column": 18 }, "end": { "line": 1, "column": 18 } }, "range": [18, 18] },
          ]
        `);
    });

    test('new azoth tokens and AST', ({ expect }) => {
        const { azoth, espree } = parse(`#\`hello {name}!\``);
        // const tokens = diff(espree.tokens, azoth.tokens, options)
        const tokens = azoth.tokens.map(t => { t.type = t.type.label; return t; });
        expect(tokens).toMatchInlineSnapshot(`
          [
            { "type": "#\`", "start": 0, "end": 2, "loc": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 2 } }, "range": [0, 2] },
            { "type": "template", "value": "hello ", "start": 2, "end": 8, "loc": { "start": { "line": 1, "column": 2 }, "end": { "line": 1, "column": 8 } }, "range": [2, 8] },
            { "type": "{ ", "start": 8, "end": 9, "loc": { "start": { "line": 1, "column": 8 }, "end": { "line": 1, "column": 9 } }, "range": [8, 9] },
            { "type": "name", "value": "name", "start": 9, "end": 13, "loc": { "start": { "line": 1, "column": 9 }, "end": { "line": 1, "column": 13 } }, "range": [9, 13] },
            { "type": " }", "start": 13, "end": 14, "loc": { "start": { "line": 1, "column": 13 }, "end": { "line": 1, "column": 14 } }, "range": [13, 14] },
            { "type": "template", "value": "!", "start": 14, "end": 15, "loc": { "start": { "line": 1, "column": 14 }, "end": { "line": 1, "column": 15 } }, "range": [14, 15] },
            { "type": "\`", "start": 15, "end": 16, "loc": { "start": { "line": 1, "column": 15 }, "end": { "line": 1, "column": 16 } }, "range": [15, 16] },
            { "type": "eof", "start": 16, "end": 16, "loc": { "start": { "line": 1, "column": 16 }, "end": { "line": 1, "column": 16 } }, "range": [16, 16] },
          ]
        `);

        expect(espree.tokens).toMatchInlineSnapshot(`
          [
            { "type": { "label": "#\`", "beforeExpr": false, "startsExpr": false, "isLoop": false, "isAssign": false, "prefix": false, "postfix": false, "binop": null }, "start": 0, "end": 2, "loc": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 2 } }, "range": [0, 2] },
            { "type": "Punctuator", "value": "{ ", "start": 8, "end": 9, "loc": { "start": { "line": 1, "column": 8 }, "end": { "line": 1, "column": 9 } }, "range": [8, 9] },
            { "type": "Identifier", "value": "name", "start": 9, "end": 13, "loc": { "start": { "line": 1, "column": 9 }, "end": { "line": 1, "column": 13 } }, "range": [9, 13] },
            { "type": "Template", "value": "hello { name }!\`", "loc": { "start": { "line": 1, "column": 1 }, "end": { "line": 1, "column": 16 } }, "start": 2, "end": 16, "range": [2, 16] },
          ]
        `);

        expect(azoth.ast).toMatchInlineSnapshot(`
          Node {
            "body": [
              Node {
                "end": 16,
                "expression": Node {
                  "binders": [
                    {
                      "end": 9,
                      "index": 1,
                      "interpolator": Node {
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
                        "name": "{",
                        "range": [
                          8,
                          9,
                        ],
                        "start": 8,
                        "type": "TemplateInterpolator",
                      },
                      "length": 3,
                      "queryIndex": -1,
                      "range": [
                        8,
                        9,
                      ],
                      "replacement": "<text-node></text-node>",
                      "start": 8,
                      "type": "ChildBinder",
                    },
                  ],
                  "elements": [],
                  "end": 16,
                  "expressions": [
                    Node {
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
                      "name": "name",
                      "range": [
                        9,
                        13,
                      ],
                      "start": 9,
                      "type": "Identifier",
                    },
                  ],
                  "html": "hello <text-node></text-node>!",
                  "loc": SourceLocation {
                    "end": Position {
                      "column": 16,
                      "line": 1,
                    },
                    "start": Position {
                      "column": 0,
                      "line": 1,
                    },
                  },
                  "range": [
                    0,
                    16,
                  ],
                  "rootType": "fragment",
                  "start": 0,
                  "type": "DomTemplateLiteral",
                },
                "loc": SourceLocation {
                  "end": Position {
                    "column": 16,
                    "line": 1,
                  },
                  "start": Position {
                    "column": 0,
                    "line": 1,
                  },
                },
                "range": [
                  0,
                  16,
                ],
                "start": 0,
                "type": "ExpressionStatement",
              },
            ],
            "end": 16,
            "loc": SourceLocation {
              "end": Position {
                "column": 16,
                "line": 1,
              },
              "start": Position {
                "column": 0,
                "line": 1,
              },
            },
            "range": [
              0,
              16,
            ],
            "sourceType": "module",
            "start": 0,
            "type": "Program",
          }
        `);

        expect(espree.ast).toMatchInlineSnapshot(`
          Node {
            "body": [
              Node {
                "end": 16,
                "expression": Node {
                  "binders": [
                    {
                      "end": 9,
                      "index": 1,
                      "interpolator": Node {
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
                        "name": "{",
                        "range": [
                          8,
                          9,
                        ],
                        "start": 8,
                        "type": "TemplateInterpolator",
                      },
                      "length": 3,
                      "queryIndex": -1,
                      "range": [
                        8,
                        9,
                      ],
                      "replacement": "<text-node></text-node>",
                      "start": 8,
                      "type": "ChildBinder",
                    },
                  ],
                  "elements": [],
                  "end": 16,
                  "expressions": [
                    Node {
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
                      "name": "name",
                      "range": [
                        9,
                        13,
                      ],
                      "start": 9,
                      "type": "Identifier",
                    },
                  ],
                  "html": "hello <text-node></text-node>!",
                  "loc": SourceLocation {
                    "end": Position {
                      "column": 16,
                      "line": 1,
                    },
                    "start": Position {
                      "column": 0,
                      "line": 1,
                    },
                  },
                  "range": [
                    0,
                    16,
                  ],
                  "rootType": "fragment",
                  "start": 0,
                  "type": "DomTemplateLiteral",
                },
                "loc": SourceLocation {
                  "end": Position {
                    "column": 16,
                    "line": 1,
                  },
                  "start": Position {
                    "column": 0,
                    "line": 1,
                  },
                },
                "range": [
                  0,
                  16,
                ],
                "start": 0,
                "type": "ExpressionStatement",
              },
            ],
            "end": 16,
            "loc": SourceLocation {
              "end": Position {
                "column": 16,
                "line": 1,
              },
              "start": Position {
                "column": 0,
                "line": 1,
              },
            },
            "range": [
              0,
              16,
            ],
            "sourceType": "module",
            "start": 0,
            "type": "Program",
          }
        `);
    });
});