import { beforeEach, describe, test, } from 'vitest';
import { parse } from './index.js';
import { toMatchCode } from '../utils/code-matchers.js';

const options = { ecmaVersion: 'latest' };
const parseTemplate = (code) => {
    if(code.toBody) code = code.toBody();
    const ast = parse(code, options);
    // remove preamble nodes
    const node = ast.body[0].expression;
    return node;
};

describe('expressions', () => {

    beforeEach(async (context) => {
        const { expect } = context;
        expect.extend(toMatchCode);
        context.templatize = code => {
            const { expressions, quasis, html, bindings } = parseTemplate(code);
            return {
                expressions,
                html,
                bindings
            };
        };
    });

    test('simple template with single {...} interpolator', ({ expect, templatize }) => {
        const template = templatize(/*html*/`#\`<p>hello {name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [
              {
                "childIndex": 1,
                "length": 3,
                "name": "p",
                "queryIndex": 0,
              },
            ],
            "expressions": [
              Node {
                "end": 16,
                "name": "name",
                "start": 12,
                "type": "Identifier",
              },
            ],
            "html": "<p data-bind>hello <!--child[1]-->!</p>",
          }
        `);
    });

    test('template with ${...}, {...}, and #{...} interpolators', ({ expect, templatize }) => {
        const template = templatize(/*html*/`
            #\`
                <p>hello \${name}!</p>
                <p>count: <span>{count}</span></p>
                <p>#{ block }</p>
            \`
        `);

        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [
              {
                "childIndex": 1,
                "length": 3,
                "name": "p",
                "queryIndex": 0,
              },
              {
                "childIndex": 0,
                "length": 1,
                "name": "span",
                "queryIndex": 1,
              },
              {
                "childIndex": 0,
                "length": 1,
                "name": "p",
                "queryIndex": 2,
              },
            ],
            "expressions": [
              Node {
                "end": 47,
                "name": "name",
                "start": 43,
                "type": "Identifier",
              },
              Node {
                "end": 92,
                "name": "count",
                "start": 87,
                "type": "Identifier",
              },
              Node {
                "end": 132,
                "name": "block",
                "start": 127,
                "type": "Identifier",
              },
            ],
            "html": "
                          <p data-bind>hello <!--child[1]-->!</p>
                          <p>count: <span data-bind><!--child[0]--></span></p>
                          <p data-bind><!--child[0]--></p>
                      ",
          }
        `);
    });

    test('template with complex expression in interpolator', ({ expect, templatize }) => {
        const template = templatize(/*html*/`
            #\`<p>{x} + {y} = {x + y}</p>\`
        `);

        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [
              {
                "childIndex": 0,
                "length": 5,
                "name": "p",
                "queryIndex": 0,
              },
              {
                "childIndex": 2,
                "length": 5,
                "name": "p",
                "queryIndex": 0,
              },
              {
                "childIndex": 4,
                "length": 5,
                "name": "p",
                "queryIndex": 0,
              },
            ],
            "expressions": [
              Node {
                "end": 20,
                "name": "x",
                "start": 19,
                "type": "Identifier",
              },
              Node {
                "end": 26,
                "name": "y",
                "start": 25,
                "type": "Identifier",
              },
              Node {
                "end": 36,
                "left": Node {
                  "end": 32,
                  "name": "x",
                  "start": 31,
                  "type": "Identifier",
                },
                "operator": "+",
                "right": Node {
                  "end": 36,
                  "name": "y",
                  "start": 35,
                  "type": "Identifier",
                },
                "start": 31,
                "type": "BinaryExpression",
              },
            ],
            "html": "<p data-bind><!--child[0]--> + <!--child[2]--> = <!--child[4]--></p>",
          }
        `);
    });

    test('property binders 1', ({ expect, templatize }) => {
        
        const template = templatize(`
            #\`
                <p class={type}>hello!</p>
                <input required={isRequired} name="title">
                <div style="color: red" class={sectionType}></div>
            \`;        
        `);
        
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [
              {
                "name": "p",
                "property": "class",
                "queryIndex": 0,
              },
              {
                "name": "input",
                "property": "required",
                "queryIndex": 1,
              },
              {
                "name": "div",
                "property": "class",
                "queryIndex": 2,
              },
            ],
            "expressions": [
              Node {
                "end": 46,
                "name": "type",
                "start": 42,
                "type": "Identifier",
              },
              Node {
                "end": 102,
                "name": "isRequired",
                "start": 92,
                "type": "Identifier",
              },
              Node {
                "end": 176,
                "name": "sectionType",
                "start": 165,
                "type": "Identifier",
              },
            ],
            "html": "
                          <p data-bind>hello!</p>
                          <input name="title" data-bind>
                          <div style="color: red" data-bind></div>
                      ",
          }
        `);
    });

    test('property binders 2', ({ expect, templatize }) => {
        
        const template = templatize(`
            #\`<div style="color: red" class="{sectionType}"></div>\`;
        `);
        
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [
              {
                "name": "div",
                "property": "class",
                "queryIndex": 0,
              },
            ],
            "expressions": [
              Node {
                "end": 58,
                "name": "sectionType",
                "start": 47,
                "type": "Identifier",
              },
            ],
            "html": "<div style="color: red" data-bind></div>",
          }
        `);
    });

    test('nested template', ({ expect, templatize }) => {
        
        const template = templatize(`
            #\`<p>#{ isVip ? #\`<span>VIP</span>\` : #\`guest\` }</p>\`;
        `);
        
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [
              {
                "childIndex": 0,
                "length": 1,
                "name": "p",
                "queryIndex": 0,
              },
            ],
            "expressions": [
              Node {
                "alternate": Node {
                  "bindings": [],
                  "end": 59,
                  "expressions": [],
                  "html": "",
                  "quasis": [
                    Node {
                      "end": 58,
                      "start": 53,
                      "tail": true,
                      "type": "TemplateElement",
                      "value": {
                        "cooked": "guest",
                        "raw": "guest",
                      },
                    },
                  ],
                  "start": 51,
                  "type": "TemplateDomLiteral",
                },
                "consequent": Node {
                  "bindings": [],
                  "end": 48,
                  "expressions": [],
                  "html": "",
                  "quasis": [
                    Node {
                      "end": 47,
                      "start": 31,
                      "tail": true,
                      "type": "TemplateElement",
                      "value": {
                        "cooked": "<span>VIP</span>",
                        "raw": "<span>VIP</span>",
                      },
                    },
                  ],
                  "start": 29,
                  "type": "TemplateDomLiteral",
                },
                "end": 59,
                "start": 21,
                "test": Node {
                  "end": 26,
                  "name": "isVip",
                  "start": 21,
                  "type": "Identifier",
                },
                "type": "ConditionalExpression",
              },
            ],
            "html": "<p data-bind><!--child[0]--></p>",
          }
        `);
    });

});