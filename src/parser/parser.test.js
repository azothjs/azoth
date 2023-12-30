import { beforeEach, describe, test, } from 'vitest';
import { parse } from './index.js';

const options = { ecmaVersion: 'latest' };
const parseToAst = (code) => {
    return parse(code, options);
};
const parseTemplate = (code) => {
    const ast = parseToAst(code);
    return ast.body[0].expression; // remove preamble nodes
};

describe('normal templates (no transformation)', () => {
    test('template literal', ({ expect }) => {
        const template = parseTemplate(/*html*/`\`<p>hello \${name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 23,
            "expressions": [
              Node {
                "end": 16,
                "name": "name",
                "start": 12,
                "type": "Identifier",
              },
            ],
            "quasis": [
              Node {
                "end": 10,
                "start": 1,
                "tail": false,
                "type": "TemplateElement",
                "value": {
                  "cooked": "<p>hello ",
                  "raw": "<p>hello ",
                },
              },
              Node {
                "end": 22,
                "start": 17,
                "tail": true,
                "type": "TemplateElement",
                "value": {
                  "cooked": "!</p>",
                  "raw": "!</p>",
                },
              },
            ],
            "start": 0,
            "type": "TemplateLiteral",
          }
        `);
    });

    test('tagged template literal', ({ expect, templatize }) => {
        const template = parseTemplate(/*html*/`tag\`<p>hello \${name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 26,
            "quasi": Node {
              "end": 26,
              "expressions": [
                Node {
                  "end": 19,
                  "name": "name",
                  "start": 15,
                  "type": "Identifier",
                },
              ],
              "quasis": [
                Node {
                  "end": 13,
                  "start": 4,
                  "tail": false,
                  "type": "TemplateElement",
                  "value": {
                    "cooked": "<p>hello ",
                    "raw": "<p>hello ",
                  },
                },
                Node {
                  "end": 25,
                  "start": 20,
                  "tail": true,
                  "type": "TemplateElement",
                  "value": {
                    "cooked": "!</p>",
                    "raw": "!</p>",
                  },
                },
              ],
              "start": 3,
              "type": "TemplateLiteral",
            },
            "start": 0,
            "tag": Node {
              "end": 3,
              "name": "tag",
              "start": 0,
              "type": "Identifier",
            },
            "type": "TaggedTemplateExpression",
          }
        `);
    });
});

describe('templates', () => {

    beforeEach(async (context) => {
        const { expect } = context;
        context.templatize = code => {
            const { expressions, html, bindings, interpolators } = parseTemplate(code);
            return {
                expressions,
                html,
                bindings,
                interpolators,
            };
        };
    });

    test('static template', ({ expect, templatize }) => {
        const template = templatize(/*html*/`#\`<p>hello</p>\``);

        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "expressions": [],
            "html": "<p>hello</p>",
            "interpolators": [],
          }
        `);
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
                "type": "ChildBinding",
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
            "html": "<p data-bind>hello <text-node></text-node>!</p>",
            "interpolators": [
              Node {
                "end": 11,
                "name": "{",
                "start": 11,
                "type": "TemplateInterpolator",
              },
            ],
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
                "type": "ChildBinding",
              },
              {
                "childIndex": 0,
                "length": 1,
                "name": "span",
                "queryIndex": 1,
                "type": "ChildBinding",
              },
              {
                "childIndex": 0,
                "length": 1,
                "name": "p",
                "queryIndex": 2,
                "type": "ChildBinding",
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
            "html": "<p data-bind>hello <text-node></text-node>!</p>
                          <p>count: <span data-bind><text-node></text-node></span></p>
                          <p data-bind><text-node></text-node></p>",
            "interpolators": [
              Node {
                "end": 41,
                "name": "\${",
                "start": 41,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 86,
                "name": "{",
                "start": 86,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 124,
                "name": "#{",
                "start": 124,
                "type": "TemplateInterpolator",
              },
            ],
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
                "type": "ChildBinding",
              },
              {
                "childIndex": 2,
                "length": 5,
                "name": "p",
                "queryIndex": 0,
                "type": "ChildBinding",
              },
              {
                "childIndex": 4,
                "length": 5,
                "name": "p",
                "queryIndex": 0,
                "type": "ChildBinding",
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
            "html": "<p data-bind><text-node></text-node> + <text-node></text-node> = <text-node></text-node></p>",
            "interpolators": [
              Node {
                "end": 18,
                "name": "{",
                "start": 18,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 24,
                "name": "{",
                "start": 24,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 30,
                "name": "{",
                "start": 30,
                "type": "TemplateInterpolator",
              },
            ],
          }
        `);
    });

    test('property binders', ({ expect, templatize }) => {
        
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
                "property": "className",
                "queryIndex": 0,
                "type": "PropertyBinding",
              },
              {
                "name": "input",
                "property": "required",
                "queryIndex": 1,
                "type": "PropertyBinding",
              },
              {
                "name": "div",
                "property": "className",
                "queryIndex": 2,
                "type": "PropertyBinding",
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
            "html": "<p data-bind>hello!</p>
                          <input name="title" data-bind>
                          <div style="color: red" data-bind></div>",
            "interpolators": [
              Node {
                "end": 41,
                "name": "{",
                "start": 41,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 91,
                "name": "{",
                "start": 91,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 164,
                "name": "{",
                "start": 164,
                "type": "TemplateInterpolator",
              },
            ],
          }
        `);
    });

    test('property and child binders', ({ expect, templatize }) => {
        
        const template = templatize(`
            #\`
            <section>
                <h2 class="item-header">{title}
                <p class={category}>
                    <span class={type}>Hello</span> {name}!
                    {description}
                </p>
            </section>
            \`;
        `);
        
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [
              {
                "childIndex": 0,
                "length": 4,
                "name": "h2",
                "queryIndex": 0,
                "type": "ChildBinding",
              },
              {
                "name": "p",
                "property": "className",
                "queryIndex": 1,
                "type": "PropertyBinding",
              },
              {
                "name": "span",
                "property": "className",
                "queryIndex": 2,
                "type": "PropertyBinding",
              },
              {
                "childIndex": 3,
                "length": 7,
                "name": "p",
                "queryIndex": 1,
                "type": "ChildBinding",
              },
              {
                "childIndex": 5,
                "length": 7,
                "name": "p",
                "queryIndex": 1,
                "type": "ChildBinding",
              },
            ],
            "expressions": [
              Node {
                "end": 84,
                "name": "title",
                "start": 79,
                "type": "Identifier",
              },
              Node {
                "end": 120,
                "name": "category",
                "start": 112,
                "type": "Identifier",
              },
              Node {
                "end": 160,
                "name": "type",
                "start": 156,
                "type": "Identifier",
              },
              Node {
                "end": 180,
                "name": "name",
                "start": 176,
                "type": "Identifier",
              },
              Node {
                "end": 215,
                "name": "description",
                "start": 204,
                "type": "Identifier",
              },
            ],
            "html": "<section>
                          <h2 class="item-header" data-bind><text-node></text-node>
                          <p data-bind>
                              <span data-bind>Hello</span> <text-node></text-node>!
                              <text-node></text-node>
                          </p>
                      </h2></section>",
            "interpolators": [
              Node {
                "end": 78,
                "name": "{",
                "start": 78,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 111,
                "name": "{",
                "start": 111,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 155,
                "name": "{",
                "start": 155,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 175,
                "name": "{",
                "start": 175,
                "type": "TemplateInterpolator",
              },
              Node {
                "end": 203,
                "name": "{",
                "start": 203,
                "type": "TemplateInterpolator",
              },
            ],
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
                "type": "ChildBinding",
              },
            ],
            "expressions": [
              Node {
                "alternate": Node {
                  "bindings": [],
                  "end": 59,
                  "expressions": [],
                  "html": "guest",
                  "interpolators": [],
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
                  "type": "DomTemplateLiteral",
                },
                "consequent": Node {
                  "bindings": [],
                  "end": 48,
                  "expressions": [],
                  "html": "<span>VIP</span>",
                  "interpolators": [],
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
                  "type": "DomTemplateLiteral",
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
            "html": "<p data-bind><text-node></text-node></p>",
            "interpolators": [
              Node {
                "end": 18,
                "name": "#{",
                "start": 18,
                "type": "TemplateInterpolator",
              },
            ],
          }
        `);
    });

});