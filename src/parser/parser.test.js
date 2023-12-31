import { beforeEach, describe, test, } from 'vitest';
import { parse } from './index.js';

const options = { ecmaVersion: 'latest' };
const parseTemplate = (code) => {
    const ast = parse(code, options);
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

    test('tagged template literal', ({ expect }) => {
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
    test('static template', ({ expect }) => {
        const template = parseTemplate(/*html*/`#\`<p>hello</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 15,
            "html": "<p>hello</p>",
            "interpolators": [],
            "start": 0,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('simple template with single {...} interpolator', ({ expect }) => {
        const template = parseTemplate(/*html*/`#\`<p>hello {name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 23,
            "html": "<p data-bind>hello <text-node></text-node>!</p>",
            "interpolators": [
              Node {
                "binding": {
                  "childIndex": 1,
                  "length": 2,
                  "name": "p",
                  "queryIndex": 0,
                  "type": "ChildBinding",
                },
                "end": 17,
                "expression": Node {
                  "end": 16,
                  "name": "name",
                  "start": 12,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 11,
                "type": "TemplateInterpolator",
              },
            ],
            "start": 0,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('template with ${...}, {...}, and #{...} interpolators', ({ expect }) => {
        const template = parseTemplate(/*html*/`
            #\`
                <p>hello \${name}!</p>
                <p>count: <span>{count}</span></p>
                <p>#{ block }</p>
            \`
        `);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 152,
            "html": "<p data-bind>hello <text-node></text-node>!</p>
                          <p>count: <span data-bind><text-node></text-node></span></p>
                          <p data-bind><text-node></text-node></p>",
            "interpolators": [
              Node {
                "binding": {
                  "childIndex": 1,
                  "length": 2,
                  "name": "p",
                  "queryIndex": 0,
                  "type": "ChildBinding",
                },
                "end": 48,
                "expression": Node {
                  "end": 47,
                  "name": "name",
                  "start": 43,
                  "type": "Identifier",
                },
                "name": "\${",
                "start": 41,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "childIndex": 0,
                  "length": 1,
                  "name": "span",
                  "queryIndex": 1,
                  "type": "ChildBinding",
                },
                "end": 93,
                "expression": Node {
                  "end": 92,
                  "name": "count",
                  "start": 87,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 86,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "childIndex": 0,
                  "length": 1,
                  "name": "p",
                  "queryIndex": 2,
                  "type": "ChildBinding",
                },
                "end": 134,
                "expression": Node {
                  "end": 132,
                  "name": "block",
                  "start": 127,
                  "type": "Identifier",
                },
                "name": "#{",
                "start": 124,
                "type": "TemplateInterpolator",
              },
            ],
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('template with complex expression in interpolator', ({ expect }) => {
        const template = parseTemplate(/*html*/`
            #\`<p>{x} + {y} = {x + y}</p>\`
        `);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 42,
            "html": "<p data-bind><text-node></text-node> + <text-node></text-node> = <text-node></text-node></p>",
            "interpolators": [
              Node {
                "binding": {
                  "childIndex": 0,
                  "length": 1,
                  "name": "p",
                  "queryIndex": 0,
                  "type": "ChildBinding",
                },
                "end": 21,
                "expression": Node {
                  "end": 20,
                  "name": "x",
                  "start": 19,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 18,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "childIndex": 2,
                  "length": 3,
                  "name": "p",
                  "queryIndex": 0,
                  "type": "ChildBinding",
                },
                "end": 27,
                "expression": Node {
                  "end": 26,
                  "name": "y",
                  "start": 25,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 24,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "childIndex": 4,
                  "length": 5,
                  "name": "p",
                  "queryIndex": 0,
                  "type": "ChildBinding",
                },
                "end": 37,
                "expression": Node {
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
                "name": "{",
                "start": 30,
                "type": "TemplateInterpolator",
              },
            ],
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('property binders', ({ expect }) => {
        
        const template = parseTemplate(`
            #\`
                <p class={type}>hello!</p>
                <input required={isRequired} name="title">
                <div style="color: red" class={sectionType}></div>
            \`;        
        `);
        
        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 198,
            "html": "<p data-bind>hello!</p>
                          <input name="title" data-bind>
                          <div style="color: red" data-bind></div>",
            "interpolators": [
              Node {
                "binding": {
                  "name": "p",
                  "property": "className",
                  "queryIndex": 0,
                  "type": "PropertyBinding",
                },
                "end": 47,
                "expression": Node {
                  "end": 46,
                  "name": "type",
                  "start": 42,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 41,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "name": "input",
                  "property": "required",
                  "queryIndex": 1,
                  "type": "PropertyBinding",
                },
                "end": 103,
                "expression": Node {
                  "end": 102,
                  "name": "isRequired",
                  "start": 92,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 91,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "name": "div",
                  "property": "className",
                  "queryIndex": 2,
                  "type": "PropertyBinding",
                },
                "end": 177,
                "expression": Node {
                  "end": 176,
                  "name": "sectionType",
                  "start": 165,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 164,
                "type": "TemplateInterpolator",
              },
            ],
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('property and child binders', ({ expect }) => {
        
        const template = parseTemplate(`
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
          Node {
            "end": 274,
            "html": "<section>
                          <h2 class="item-header" data-bind><text-node></text-node>
                          <p data-bind>
                              <span data-bind>Hello</span> <text-node></text-node>!
                              <text-node></text-node>
                          </p>
                      </h2></section>",
            "interpolators": [
              Node {
                "binding": {
                  "childIndex": 0,
                  "length": 1,
                  "name": "h2",
                  "queryIndex": 0,
                  "type": "ChildBinding",
                },
                "end": 85,
                "expression": Node {
                  "end": 84,
                  "name": "title",
                  "start": 79,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 78,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "name": "p",
                  "property": "className",
                  "queryIndex": 1,
                  "type": "PropertyBinding",
                },
                "end": 121,
                "expression": Node {
                  "end": 120,
                  "name": "category",
                  "start": 112,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 111,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "name": "span",
                  "property": "className",
                  "queryIndex": 2,
                  "type": "PropertyBinding",
                },
                "end": 161,
                "expression": Node {
                  "end": 160,
                  "name": "type",
                  "start": 156,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 155,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "childIndex": 3,
                  "length": 4,
                  "name": "p",
                  "queryIndex": 1,
                  "type": "ChildBinding",
                },
                "end": 181,
                "expression": Node {
                  "end": 180,
                  "name": "name",
                  "start": 176,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 175,
                "type": "TemplateInterpolator",
              },
              Node {
                "binding": {
                  "childIndex": 5,
                  "length": 6,
                  "name": "p",
                  "queryIndex": 1,
                  "type": "ChildBinding",
                },
                "end": 216,
                "expression": Node {
                  "end": 215,
                  "name": "description",
                  "start": 204,
                  "type": "Identifier",
                },
                "name": "{",
                "start": 203,
                "type": "TemplateInterpolator",
              },
            ],
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('nested template', ({ expect }) => {
        
        const template = parseTemplate(`
            #\`<p>#{ isVip ? #\`<span>VIP</span>\` : #\`guest\` }</p>\`;
        `);
        
        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 66,
            "html": "<p data-bind><text-node></text-node></p>",
            "interpolators": [
              Node {
                "binding": {
                  "childIndex": 0,
                  "length": 1,
                  "name": "p",
                  "queryIndex": 0,
                  "type": "ChildBinding",
                },
                "end": 61,
                "expression": Node {
                  "alternate": Node {
                    "end": 59,
                    "html": "guest",
                    "interpolators": [],
                    "start": 51,
                    "type": "DomTemplateLiteral",
                  },
                  "consequent": Node {
                    "end": 48,
                    "html": "<span>VIP</span>",
                    "interpolators": [],
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
                "name": "#{",
                "start": 18,
                "type": "TemplateInterpolator",
              },
            ],
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

});