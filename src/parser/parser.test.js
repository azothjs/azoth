import { beforeEach, describe, test, } from 'vitest';
import { parse } from './index.js';
import { addSerializers } from './serializers.js';

const options = { ecmaVersion: 'latest' };
const parseTemplate = (code) => {
    const ast = parse(code, options);
    return ast.body[0].expression; // remove preamble nodes
};

beforeEach(({ expect }) => addSerializers(expect, [
    'DomTemplateElement', 
    'TemplateInterpolator',
    // 'ChildBinding', 
    // 'PropertyBinding', 
    'Identifier', 
    'TemplateElement',
]));

describe('normal templates (no transformation)', () => {
    test('template literal', ({ expect }) => {
        const template = parseTemplate(/*html*/`\`<p>hello \${name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 23,
            "expressions": [
              { "type": "Identifier", "start": 12, "end": 16, "name": "name" },
            ],
            "quasis": [
              { "type": "TemplateElement", "start": 1, "end": 10, "value": { "raw": "<p>hello ", "cooked": "<p>hello " }, "tail": false },
              { "type": "TemplateElement", "start": 17, "end": 22, "value": { "raw": "!</p>", "cooked": "!</p>" }, "tail": true },
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
                { "type": "Identifier", "start": 15, "end": 19, "name": "name" },
              ],
              "quasis": [
                { "type": "TemplateElement", "start": 4, "end": 13, "value": { "raw": "<p>hello ", "cooked": "<p>hello " }, "tail": false },
                { "type": "TemplateElement", "start": 20, "end": 25, "value": { "raw": "!</p>", "cooked": "!</p>" }, "tail": true },
              ],
              "start": 3,
              "type": "TemplateLiteral",
            },
            "start": 0,
            "tag": { "type": "Identifier", "start": 0, "end": 3, "name": "tag" },
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
            "bindings": [],
            "elements": [],
            "end": 15,
            "expressions": [],
            "html": "<p-0>hello</p>",
            "rootType": "element",
            "start": 0,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('simple template with single {...} interpolator', ({ expect }) => {
        const template = parseTemplate(/*html*/`#\`<p>hello {name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "bindings": [
              {
                "index": 1,
                "interpolator": { "type": "TemplateInterpolator", "start": 11, "end": 12, "name": "{ " },
                "length": 3,
                "queryIndex": 0,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 3, "queryIndex": 0, "start": 1, "end": 2 },
            ],
            "end": 23,
            "expressions": [
              { "type": "Identifier", "start": 12, "end": 16, "name": "name" },
            ],
            "html": "<p-0 data-bind>hello <text-node></text-node>!</p>",
            "rootType": "element",
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
            "bindings": [
              {
                "index": 1,
                "interpolator": { "type": "TemplateInterpolator", "start": 41, "end": 43, "name": "\${ " },
                "length": 3,
                "queryIndex": 0,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
              {
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 86, "end": 87, "name": "{ " },
                "length": 1,
                "queryIndex": 1,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
              {
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 124, "end": 126, "name": "#{ " },
                "length": 1,
                "queryIndex": 2,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 3, "queryIndex": 0, "start": 18, "end": 19 },
              { "type": "DomTemplateElement", "name": "span", "length": 1, "queryIndex": 1, "start": 59, "end": 63 },
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 2, "start": 93, "end": 94 },
            ],
            "end": 152,
            "expressions": [
              { "type": "Identifier", "start": 43, "end": 47, "name": "name" },
              { "type": "Identifier", "start": 87, "end": 92, "name": "count" },
              { "type": "Identifier", "start": 127, "end": 132, "name": "block" },
            ],
            "html": "<p-17 data-bind>hello <text-node></text-node>!</p>
                          <p-48>count: <span-58 data-bind><text-node></text-node></span></p>
                          <p-92 data-bind><text-node></text-node></p>",
            "rootType": "fragment",
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
            "bindings": [
              {
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 18, "end": 19, "name": "{ " },
                "length": 5,
                "queryIndex": 0,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
              {
                "index": 2,
                "interpolator": { "type": "TemplateInterpolator", "start": 24, "end": 25, "name": "{ " },
                "length": 5,
                "queryIndex": 0,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
              {
                "index": 4,
                "interpolator": { "type": "TemplateInterpolator", "start": 30, "end": 31, "name": "{ " },
                "length": 5,
                "queryIndex": 0,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 5, "queryIndex": 0, "start": 1, "end": 2 },
            ],
            "end": 42,
            "expressions": [
              { "type": "Identifier", "start": 19, "end": 20, "name": "x" },
              { "type": "Identifier", "start": 25, "end": 26, "name": "y" },
              Node {
                "end": 36,
                "left": { "type": "Identifier", "start": 31, "end": 32, "name": "x" },
                "operator": "+",
                "right": { "type": "Identifier", "start": 35, "end": 36, "name": "y" },
                "start": 31,
                "type": "BinaryExpression",
              },
            ],
            "html": "<p-0 data-bind><text-node></text-node> + <text-node></text-node> = <text-node></text-node></p>",
            "rootType": "element",
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
            "bindings": [
              {
                "attribute": "class",
                "interpolator": { "type": "TemplateInterpolator", "start": 41, "end": 42, "name": "{ " },
                "name": "class",
                "property": "className",
                "queryIndex": 0,
                "type": "PropertyBinding",
              },
              {
                "attribute": "required",
                "interpolator": { "type": "TemplateInterpolator", "start": 91, "end": 92, "name": "{ " },
                "name": "required",
                "property": "required",
                "queryIndex": 1,
                "type": "PropertyBinding",
              },
              {
                "attribute": "class",
                "interpolator": { "type": "TemplateInterpolator", "start": 164, "end": 165, "name": "{ " },
                "name": "class",
                "property": "className",
                "queryIndex": 2,
                "type": "PropertyBinding",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 0, "start": 18, "end": 19 },
              { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 1, "start": 57, "end": 62 },
              { "type": "DomTemplateElement", "name": "div", "length": 0, "queryIndex": 2, "start": 106, "end": 109 },
            ],
            "end": 198,
            "expressions": [
              { "type": "Identifier", "start": 42, "end": 46, "name": "type" },
              { "type": "Identifier", "start": 92, "end": 102, "name": "isRequired" },
              { "type": "Identifier", "start": 165, "end": 176, "name": "sectionType" },
            ],
            "html": "<p-17 data-bind>hello!</p>
                          <input-56 name="title" data-bind>
                          <div-105 style="color: red" data-bind></div>",
            "rootType": "fragment",
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('property and child binders', ({ expect }) => {
        
        const template = parseTemplate(`
            #\`
            <section>
                <h2 class="item-header">{title}</h2>
                <p class={category}>
                    <span class={type}>Hello</span> {name}!
                    {description}
                </p>
            </section>
            \`;
        `);
        
        expect(template).toMatchInlineSnapshot(`
          Node {
            "bindings": [
              {
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 78, "end": 79, "name": "{ " },
                "length": 1,
                "queryIndex": 0,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
              {
                "attribute": "class",
                "interpolator": { "type": "TemplateInterpolator", "start": 116, "end": 117, "name": "{ " },
                "name": "class",
                "property": "className",
                "queryIndex": 1,
                "type": "PropertyBinding",
              },
              {
                "attribute": "class",
                "interpolator": { "type": "TemplateInterpolator", "start": 160, "end": 161, "name": "{ " },
                "name": "class",
                "property": "className",
                "queryIndex": 2,
                "type": "PropertyBinding",
              },
              {
                "index": 3,
                "interpolator": { "type": "TemplateInterpolator", "start": 180, "end": 181, "name": "{ " },
                "length": 7,
                "queryIndex": 1,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
              {
                "index": 5,
                "interpolator": { "type": "TemplateInterpolator", "start": 208, "end": 209, "name": "{ " },
                "length": 7,
                "queryIndex": 1,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "h2", "length": 1, "queryIndex": 0, "start": 40, "end": 42 },
              { "type": "DomTemplateElement", "name": "p", "length": 7, "queryIndex": 1, "start": 86, "end": 87 },
              { "type": "DomTemplateElement", "name": "span", "length": 1, "queryIndex": 2, "start": 119, "end": 123 },
            ],
            "end": 279,
            "expressions": [
              { "type": "Identifier", "start": 79, "end": 84, "name": "title" },
              { "type": "Identifier", "start": 117, "end": 125, "name": "category" },
              { "type": "Identifier", "start": 161, "end": 165, "name": "type" },
              { "type": "Identifier", "start": 181, "end": 185, "name": "name" },
              { "type": "Identifier", "start": 209, "end": 220, "name": "description" },
            ],
            "html": "<section-13>
                          <h2-39 class="item-header" data-bind><text-node></text-node></h2>
                          <p-85 data-bind>
                              <span-118 data-bind>Hello</span> <text-node></text-node>!
                              <text-node></text-node>
                          </p>
                      </section>",
            "rootType": "fragment",
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
            "bindings": [
              {
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 18, "end": 20, "name": "#{ " },
                "length": 1,
                "queryIndex": 0,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 0, "start": 1, "end": 2 },
            ],
            "end": 66,
            "expressions": [
              Node {
                "alternate": Node {
                  "bindings": [],
                  "elements": [],
                  "end": 59,
                  "expressions": [],
                  "html": "guest",
                  "rootType": "text",
                  "start": 51,
                  "type": "DomTemplateLiteral",
                },
                "consequent": Node {
                  "bindings": [],
                  "elements": [],
                  "end": 48,
                  "expressions": [],
                  "html": "<span-0>VIP</span>",
                  "rootType": "element",
                  "start": 29,
                  "type": "DomTemplateLiteral",
                },
                "end": 59,
                "start": 21,
                "test": { "type": "Identifier", "start": 21, "end": 26, "name": "isVip" },
                "type": "ConditionalExpression",
              },
            ],
            "html": "<p-0 data-bind><text-node></text-node></p>",
            "rootType": "element",
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });
});

describe('source locations', () => {

    test('elements', ({ expect, parser }) => {
        const template = parseTemplate(/*html*/`#\`<p>{text1}</p><p>{text2}</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "bindings": [
              {
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 5, "end": 6, "name": "{ " },
                "length": 1,
                "queryIndex": 0,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
              {
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 19, "end": 20, "name": "{ " },
                "length": 1,
                "queryIndex": 1,
                "replacement": "<text-node></text-node>",
                "type": "ChildBinding",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 0, "start": 1, "end": 2 },
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 1, "start": 8, "end": 9 },
            ],
            "end": 31,
            "expressions": [
              { "type": "Identifier", "start": 6, "end": 11, "name": "text1" },
              { "type": "Identifier", "start": 20, "end": 25, "name": "text2" },
            ],
            "html": "<p-0 data-bind><text-node></text-node></p><p-7 data-bind><text-node></text-node></p>",
            "rootType": "fragment",
            "start": 0,
            "type": "DomTemplateLiteral",
          }
        `);
    });
});