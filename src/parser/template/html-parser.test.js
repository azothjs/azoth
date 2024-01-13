import { beforeEach, describe, test, } from 'vitest';
import { TemplateParser, findInfo } from './html-parser.js';
import { addSerializers } from '../serializers.js';
import { html, find } from 'property-information';

beforeEach(context => {
    context.parser = new TemplateParser();
});

describe('parser operations', () => {
    test.fails('error calling write after end', ({ parser }) => {
        parser.end();
        parser.write();
    });

    test('same html and binders on repeated end call or parser props', ({ expect, parser }) => {
        parser.write();
        const { html, binders, elements } = parser.end();
        const { html: h2, binders: b2, elements: e2 } = parser.end();
        expect(html).toBe(h2).toBe(parser.html);
        expect(binders).toBe(b2).toBe(parser.binders);
        expect(elements).toBe(e2).toBe(parser.elements);
    });
});

describe('static html', () => {
    test('plain text', ({ expect, parser }) => {
        const template = parser.end('hi');
        expect(template).toMatchInlineSnapshot(`
          {
            "binders": [],
            "elements": [],
            "html": "hi",
            "rootType": "text",
          }
        `);
    });
        
    test('attributes', ({ expect, parser }) => {
        const template = parser.end(`<input name="cat" required class=cool type='text'>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "binders": [],
            "elements": [],
            "html": "<input name="cat" required class="cool" type="text">",
            "rootType": "element",
          }
        `);
    });

    test('element with class and text content', ({ expect, parser }) => {
        const template = parser.end(`<span class="greeting">hello world</span>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "binders": [],
            "elements": [],
            "html": "<span class="greeting">hello world</span>",
            "rootType": "element",
          }
        `);
    });

    test('self-closing element converted to real HTML element', ({ expect, parser }) => {
        const template = parser.end(`<self-closing/>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "binders": [],
            "elements": [],
            "html": "<self-closing></self-closing>",
            "rootType": "element",
          }
        `);
    });

    test('void and self-closing elements', ({ expect, parser }) => {
        const template = parser.end(`
            <br>
            <br/>
            <self-closing/>text
            <custom-element></custom-element>
            <div></div>
            <div>text</div>        
        `);

        expect(template).toMatchInlineSnapshot(`
          {
            "binders": [],
            "elements": [],
            "html": "<br>
                      <br>
                      <self-closing></self-closing>text
                      <custom-element></custom-element>
                      <div></div>
                      <div>text</div>",
            "rootType": "fragment",
          }
        `);
    });
    
    test('nested elements', ({ expect, parser }) => {
        const template = parser.end(`<div><div><div><div><div></div></div></div></div></div>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "binders": [],
            "elements": [],
            "html": "<div><div><div><div><div></div></div></div></div></div>",
            "rootType": "element",
          }
        `);
    });

    test('html comments', ({ expect, parser }) => {
        const template = parser.end(`<span class="greeting"><!--hello--> world</span>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "binders": [],
            "elements": [],
            "html": "<span class="greeting"><!--hello--> world</span>",
            "rootType": "element",
          }
        `);

    });
});

describe('binders', () => {

    beforeEach(({ expect }) => addSerializers(expect, {
        types: ['ChildBinder', 'PropertyBinder', 'DomTemplateElement']
    }));
    
    describe('child nodes', () => {
        test('empty root with binder', ({ expect, parser }) => {
            parser.write(``);
            const template = parser.end(``);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "ChildBinder", "queryIndex": -1, "interpolator": null, "index": 0, "length": 1, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                ],
                "elements": [],
                "html": "<text-node></text-node>",
                "rootType": "text",
              }
            `);
        });

        test('two binders at root', ({ expect, parser }) => {
            parser.write(``);
            parser.write(``);
            const template = parser.end(``);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "ChildBinder", "queryIndex": -1, "interpolator": null, "index": 0, "length": 2, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                  { "type": "ChildBinder", "queryIndex": -1, "interpolator": null, "index": 1, "length": 2, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                ],
                "elements": [],
                "html": "<text-node></text-node><text-node></text-node>",
                "rootType": "fragment",
              }
            `);
        });
      
        test('element with text and interpolator', ({ expect, parser }) => {
            parser.write(`<p>hello `);
            const template = parser.end(`!</p>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "ChildBinder", "queryIndex": 0, "interpolator": null, "index": 1, "length": 3, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 3, "queryIndex": 0, "start": 1, "end": 2, "range": [1, 2] },
                ],
                "html": "<p data-bind>hello <text-node></text-node>!</p>",
                "rootType": "element",
              }
            `);
        });

        test('element with text, html comment, interpolator', ({ expect, parser }) => {
            parser.write(`<p>hello <!--comment 1-->`);
            const template = parser.end(`<!--comment 2--> and welcome!</p>`);
            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "ChildBinder", "queryIndex": 0, "interpolator": null, "index": 2, "length": 5, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 5, "queryIndex": 0, "start": 1, "end": 2, "range": [1, 2] },
                ],
                "html": "<p data-bind>hello <!--comment 1--><text-node></text-node><!--comment 2--> and welcome!</p>",
                "rootType": "element",
              }
            `);
        });

        test('elements with mix of text and interpolators', ({ expect, parser }) => {
            parser.write(`<section>hello `);
            parser.write(`!</section> <p>sum of `);
            parser.write(` and `);
            parser.write(` equals <span>`);
            parser.write(`</span></p> <div>`);
            const template = parser.end(`</div>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "ChildBinder", "queryIndex": 0, "interpolator": null, "index": 1, "length": 3, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                  { "type": "ChildBinder", "queryIndex": 1, "interpolator": null, "index": 1, "length": 6, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                  { "type": "ChildBinder", "queryIndex": 1, "interpolator": null, "index": 3, "length": 6, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                  { "type": "ChildBinder", "queryIndex": 2, "interpolator": null, "index": 0, "length": 1, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                  { "type": "ChildBinder", "queryIndex": 3, "interpolator": null, "index": 0, "length": 1, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "section", "length": 3, "queryIndex": 0, "start": 1, "end": 8, "range": [1, 8] },
                  { "type": "DomTemplateElement", "name": "p", "length": 6, "queryIndex": 1, "start": 28, "end": 29, "range": [28, 29] },
                  { "type": "DomTemplateElement", "name": "span", "length": 1, "queryIndex": 2, "start": 51, "end": 55, "range": [51, 55] },
                  { "type": "DomTemplateElement", "name": "div", "length": 1, "queryIndex": 3, "start": 69, "end": 72, "range": [69, 72] },
                ],
                "html": "<section data-bind>hello <text-node></text-node>!</section> <p data-bind>sum of <text-node></text-node> and <text-node></text-node> equals <span data-bind><text-node></text-node></span></p> <div data-bind><text-node></text-node></div>",
                "rootType": "fragment",
              }
            `);
        });

        test('correct query order', ({ expect, parser }) => {
            parser.write(`<div><p>one</p><p>`);
            parser.write(`</p>`);
            const template = parser.end(`</div>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "ChildBinder", "queryIndex": 1, "interpolator": null, "index": 0, "length": 1, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                  { "type": "ChildBinder", "queryIndex": 0, "interpolator": null, "index": 2, "length": 3, "replacement": "<text-node></text-node>", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "div", "length": 3, "queryIndex": 0, "start": 1, "end": 4, "range": [1, 4] },
                  { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 1, "start": 16, "end": 17, "range": [16, 17] },
                ],
                "html": "<div data-bind><p>one</p><p data-bind><text-node></text-node></p><text-node></text-node></div>",
                "rootType": "element",
              }
            `);
        });
    });


    describe('properties', () => {
      
        test('single unquoted attribute', ({ expect, parser }) => {
            parser.write(`<p class=`);
            const template = parser.end(`></p>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "class", "property": "className", "attribute": "class", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 0, "queryIndex": 0, "start": 1, "end": 2, "range": [1, 2] },
                ],
                "html": "<p data-bind></p>",
                "rootType": "element",
              }
            `);
        });

        test('preceding empty attribute', ({ expect, parser }) => {
            parser.write(`<input required class=`);
            const template = parser.end(`>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "class", "property": "className", "attribute": "class", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 0, "start": 1, "end": 6, "range": [1, 6] },
                ],
                "html": "<input required data-bind>",
                "rootType": "element",
              }
            `);
        });

        test('single double-quoted attribute', ({ expect, parser }) => {
            parser.write(`<p class="`);
            const template = parser.end(`"></p>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "class", "property": "className", "attribute": "class", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 0, "queryIndex": 0, "start": 1, "end": 2, "range": [1, 2] },
                ],
                "html": "<p data-bind></p>",
                "rootType": "element",
              }
            `);
        });

        test('single single-quoted attribute', ({ expect, parser }) => {
            parser.write(`<p class='`);
            const template = parser.end(`'></p>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "class", "property": "className", "attribute": "class", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 0, "queryIndex": 0, "start": 1, "end": 2, "range": [1, 2] },
                ],
                "html": "<p data-bind></p>",
                "rootType": "element",
              }
            `);
        });

        test('multiple attributes with mix of bound, static, and empty', ({ expect, parser }) => {
            parser.write(`<input class=`);
            parser.write(` required name="`);
            parser.write(`" maxLength='`);
            parser.write(`' type='text' disabled=`);
            const template = parser.end(`>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "class", "property": "className", "attribute": "class", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "name", "property": "name", "attribute": "name", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "maxLength", "property": "maxLength", "attribute": "maxlength", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "disabled", "property": "disabled", "attribute": "disabled", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 0, "start": 1, "end": 6, "range": [1, 6] },
                ],
                "html": "<input required type="text" data-bind>",
                "rootType": "element",
              }
            `);
        });

        test('all no quote or empty attributes', ({ expect, parser }) => {
            parser.write(`<input class=`);
            parser.write(` required name=`);
            parser.write(` type=`);
            const template = parser.end(`>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "class", "property": "className", "attribute": "class", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "name", "property": "name", "attribute": "name", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "type", "property": "type", "attribute": "type", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 0, "start": 1, "end": 6, "range": [1, 6] },
                ],
                "html": "<input required data-bind>",
                "rootType": "element",
              }
            `);
        });
    });


    describe('attribute quote handling', () => {

        test('extra space before next quote', ({ expect, parser }) => {
            parser.write(`<input name="`);
            parser.write(`   " type='`);
            const template = parser.end(`   '>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "name", "property": "name", "attribute": "name", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "type", "property": "type", "attribute": "type", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 0, "start": 1, "end": 6, "range": [1, 6] },
                ],
                "html": "<input data-bind>",
                "rootType": "element",
              }
            `);
        });

        test('extra space before interpolator', ({ expect, parser }) => {
            parser.write(`<input name="  `);
            parser.write(`" type='  `);
            const template = parser.end(`'>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "name", "property": "name", "attribute": "name", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "type", "property": "type", "attribute": "type", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 0, "start": 1, "end": 6, "range": [1, 6] },
                ],
                "html": "<input data-bind>",
                "rootType": "element",
              }
            `);
        });

        test('no quotes', ({ expect, parser }) => {
            parser.write(`<input class=`);
            parser.write(`required  type=`);
            const template = parser.end(`>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "class", "property": "className", "attribute": "class", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "type", "property": "type", "attribute": "type", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 0, "start": 1, "end": 6, "range": [1, 6] },
                ],
                "html": "<input required data-bind>",
                "rootType": "element",
              }
            `);
        });

        test('mixed', ({ expect, parser }) => {
            parser.write(`<input class=`);
            parser.write(` name="`);
            parser.write(`   " maxLength='`);
            parser.write(`  ' type="   `);
            parser.write(`" style='   `);
            const template = parser.end(`>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "binders": [
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "class", "property": "className", "attribute": "class", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "name", "property": "name", "attribute": "name", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "maxLength", "property": "maxLength", "attribute": "maxlength", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "type", "property": "type", "attribute": "type", "start": -1, "end": -1, "range": null },
                  { "type": "PropertyBinder", "queryIndex": 0, "interpolator": null, "name": "style", "property": "style", "attribute": "style", "start": -1, "end": -1, "range": null },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 0, "start": 1, "end": 6, "range": [1, 6] },
                ],
                "html": "<input data-bind>",
                "rootType": "element",
              }
            `);
        });

        describe.each([
            `<input required`,
            `<input required    `,
            `<input `,
        // `<input`, TODO edge case
        ])('invalid attribute binder', (template) => {
            test.fails(template, ({ parser }) => {
                parser.write(template);
            });
        });
    });
});
