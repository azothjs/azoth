import { beforeEach, describe, test, } from 'vitest';
import { TemplateParser } from './html-parser.js';
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

    test('same html and bindings on repeated end call or parser props', ({ expect, parser }) => {
        parser.write();
        const { html, bindings, elements } = parser.end();
        const { html: h2, bindings: b2, elements: e2 } = parser.end();
        expect(html).toBe(h2).toBe(parser.html);
        expect(bindings).toBe(b2).toBe(parser.bindings);
        expect(elements).toBe(e2).toBe(parser.elements);
    });
});

describe('static html', () => {
    test('plain text', ({ expect, parser }) => {
        const template = parser.end('hi');
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
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
            "bindings": [],
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
            "bindings": [],
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
            "bindings": [],
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
            "bindings": [],
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
            "bindings": [],
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
            "bindings": [],
            "elements": [],
            "html": "<span class="greeting"><!--hello--> world</span>",
            "rootType": "element",
          }
        `);

    });
});

describe('bindings', () => {

    beforeEach(({ expect }) => addSerializers(expect, ['ChildBinding', 'PropertyBinding', 'DomTemplateElement']));
    
    describe('child nodes', () => {
        test('empty root with binding', ({ expect, parser }) => {
            parser.write(``);
            const template = parser.end(``);

            expect(template).toMatchInlineSnapshot(`
              {
                "bindings": [
                  { "type": "ChildBinding", "index": 0, "queryIndex": -1, "length": 1, "replacement": "<text-node></text-node>" },
                ],
                "elements": [],
                "html": "<text-node></text-node>",
                "rootType": "text",
              }
            `);
        });

        test('two bindings at root', ({ expect, parser }) => {
            parser.write(``);
            parser.write(``);
            const template = parser.end(``);

            expect(template).toMatchInlineSnapshot(`
              {
                "bindings": [
                  { "type": "ChildBinding", "index": 0, "queryIndex": -1, "length": 2, "replacement": "<text-node></text-node>" },
                  { "type": "ChildBinding", "index": 1, "queryIndex": -1, "length": 2, "replacement": "<text-node></text-node>" },
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
                "bindings": [
                  { "type": "ChildBinding", "index": 1, "queryIndex": 0, "length": 3, "replacement": "<text-node></text-node>" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 3 },
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
                "bindings": [
                  { "type": "ChildBinding", "index": 2, "queryIndex": 0, "length": 5, "replacement": "<text-node></text-node>" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 5 },
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
                "bindings": [
                  { "type": "ChildBinding", "index": 1, "queryIndex": 0, "length": 3, "replacement": "<text-node></text-node>" },
                  { "type": "ChildBinding", "index": 1, "queryIndex": 1, "length": 6, "replacement": "<text-node></text-node>" },
                  { "type": "ChildBinding", "index": 3, "queryIndex": 1, "length": 6, "replacement": "<text-node></text-node>" },
                  { "type": "ChildBinding", "index": 0, "queryIndex": 2, "length": 1, "replacement": "<text-node></text-node>" },
                  { "type": "ChildBinding", "index": 0, "queryIndex": 3, "length": 1, "replacement": "<text-node></text-node>" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "section", "length": 3 },
                  { "type": "DomTemplateElement", "name": "p", "length": 6 },
                  { "type": "DomTemplateElement", "name": "span", "length": 1 },
                  { "type": "DomTemplateElement", "name": "div", "length": 1 },
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
                "bindings": [
                  { "type": "ChildBinding", "index": 0, "queryIndex": 1, "length": 1, "replacement": "<text-node></text-node>" },
                  { "type": "ChildBinding", "index": 2, "queryIndex": 0, "length": 3, "replacement": "<text-node></text-node>" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "div", "length": 3 },
                  { "type": "DomTemplateElement", "name": "p", "length": 1 },
                ],
                "html": "<div data-bind><p>one</p><p data-bind><text-node></text-node></p><text-node></text-node></div>",
                "rootType": "element",
              }
            `);
        });
    });


    describe('properties', () => {
      
        describe('property-information pinned behavior', () => {
            test('find attribute or property', ({ expect }) => {
                expect(find(html, 'class')).toMatchInlineSnapshot(`
                  DefinedInfo {
                    "attribute": "class",
                    "property": "className",
                    "space": "html",
                    "spaceSeparated": true,
                  }
                `);
                expect(find(html, 'CLASS')).toMatchInlineSnapshot(`
                  DefinedInfo {
                    "attribute": "class",
                    "property": "className",
                    "space": "html",
                    "spaceSeparated": true,
                  }
                `);
                expect(find(html, 'Class')).toMatchInlineSnapshot(`
                  DefinedInfo {
                    "attribute": "class",
                    "property": "className",
                    "space": "html",
                    "spaceSeparated": true,
                  }
                `);
                expect(find(html, 'className')).toMatchInlineSnapshot(`
                  DefinedInfo {
                    "attribute": "class",
                    "property": "className",
                    "space": "html",
                    "spaceSeparated": true,
                  }
                `);
                expect(find(html, 'classname')).toMatchInlineSnapshot(`
                  DefinedInfo {
                    "attribute": "class",
                    "property": "className",
                    "space": "html",
                    "spaceSeparated": true,
                  }
                `);
                expect(find(html, 'class-name')).toMatchInlineSnapshot(`
                  Info {
                    "attribute": "class-name",
                    "property": "class-name",
                  }
                `);
                expect(find(html, 'for')).toMatchInlineSnapshot(`
                  DefinedInfo {
                    "attribute": "for",
                    "property": "htmlFor",
                    "space": "html",
                    "spaceSeparated": true,
                  }
                `);
                expect(find(html, 'html-for')).toMatchInlineSnapshot(`
                  Info {
                    "attribute": "html-for",
                    "property": "html-for",
                  }
                `);
            });
        });

        test('single unquoted attribute', ({ expect, parser }) => {
            parser.write(`<p class=`);
            const template = parser.end(`></p>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "class", "property": "className", "attribute": "class" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 0 },
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
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "class", "property": "className", "attribute": "class" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0 },
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
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "class", "property": "className", "attribute": "class" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 0 },
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
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "class", "property": "className", "attribute": "class" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "p", "length": 0 },
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
            const template = parser.end(`></p>`);

            expect(template).toMatchInlineSnapshot(`
              {
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "class", "property": "className", "attribute": "class" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "name", "property": "name", "attribute": "name" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "maxLength", "property": "maxLength", "attribute": "maxlength" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "disabled", "property": "disabled", "attribute": "disabled" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0 },
                ],
                "html": "<input required type="text" data-bind><p></p>",
                "rootType": "fragment",
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
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "class", "property": "className", "attribute": "class" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "name", "property": "name", "attribute": "name" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "type", "property": "type", "attribute": "type" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0 },
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
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "name", "property": "name", "attribute": "name" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "type", "property": "type", "attribute": "type" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0 },
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
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "name", "property": "name", "attribute": "name" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "type", "property": "type", "attribute": "type" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0 },
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
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "class", "property": "className", "attribute": "class" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "type", "property": "type", "attribute": "type" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0 },
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
                "bindings": [
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "class", "property": "className", "attribute": "class" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "name", "property": "name", "attribute": "name" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "maxLength", "property": "maxLength", "attribute": "maxlength" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "type", "property": "type", "attribute": "type" },
                  { "type": "PropertyBinding", "queryIndex": 0, "name": "style", "property": "style", "attribute": "style" },
                ],
                "elements": [
                  { "type": "DomTemplateElement", "name": "input", "length": 0 },
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