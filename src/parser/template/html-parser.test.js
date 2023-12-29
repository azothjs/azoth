import { beforeEach, describe, test, } from 'vitest';
import { TemplateParser } from './html-parser.js';
import { addSerializers } from '../serializers.js';
 
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
        const { html, bindings } = parser.end();
        const { html: h2, bindings: b2 } = parser.end();
        expect(html).toBe(h2).toBe(parser.html);
        expect(bindings).toBe(b2).toBe(parser.bindings);
    });
});

describe('static html', () => {
    
    test('plain text', ({ expect, parser }) => {
        const template = parser.end('hi');
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "html": "hi",
          }
        `);
    });
        
    test('attributes', ({ expect, parser }) => {
        const template = parser.end(`<input name="cat" required class=cool type='text'>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "html": "<input name="cat" required class="cool" type="text">",
          }
        `);
    });

    test('element with class and text content', ({ expect, parser }) => {
        const template = parser.end(`<span class="greeting">hello world</span>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "html": "<span class="greeting">hello world</span>",
          }
        `);
    });

    test('self-closing element converted to real HTML element', ({ expect, parser }) => {
        const template = parser.end(`<self-closing/>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "html": "<self-closing></self-closing>",
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
            "html": "<br>
                      <br>
                      <self-closing></self-closing>text
                      <custom-element></custom-element>
                      <div></div>
                      <div>text</div>",
          }
        `);
    });
    
    test('nested elements', ({ expect, parser }) => {
        const template = parser.end(`<div><div><div><div><div></div></div></div></div></div>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "html": "<div><div><div><div><div></div></div></div></div></div>",
          }
        `);
    });

    test('html comments', ({ expect, parser }) => {
        const template = parser.end(`<span class="greeting"><!--hello--> world</span>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "html": "<span class="greeting"><!--hello--> world</span>",
          }
        `);

    });
});

describe('bindings', () => {

    beforeEach(({ expect }) => addSerializers(expect));

    describe('child nodes', () => {
      
        test('empty root with binding', ({ expect, parser }) => {
            parser.write(``);
            const { html, bindings } = parser.end(``);

            expect(html).toMatchInlineSnapshot(`"<text-node></text-node>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "ChildBinding", "queryIndex": -1, "name": "<>", "childIndex": 0, "length": 1 },
              ]
            `);
        });

        test('two bindings at root', ({ expect, parser }) => {
            parser.write(``);
            parser.write(``);
            const { html, bindings } = parser.end(``);

            expect(html).toMatchInlineSnapshot(`"<text-node></text-node><text-node></text-node>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "ChildBinding", "queryIndex": -1, "name": "<>", "childIndex": 0, "length": 2 },
                { "type": "ChildBinding", "queryIndex": -1, "name": "<>", "childIndex": 1, "length": 2 },
              ]
            `);
        });
      
        test('element with text and interpolator', ({ expect, parser }) => {
            parser.write(`<p>hello `);
            const { html, bindings } = parser.end(`!</p>`);

            expect(html).toMatchInlineSnapshot(`"<p data-bind>hello <text-node></text-node>!</p>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "ChildBinding", "queryIndex": 0, "name": "p", "childIndex": 1, "length": 3 },
              ]
            `);
        });

        test('element with text, html comment, interpolator', ({ expect, parser }) => {
            parser.write(`<p>hello <!--comment 1-->`);
            const { html, bindings } = parser.end(`<!--comment 2--> and welcome!</p>`);

            expect(html).toMatchInlineSnapshot(
                `"<p data-bind>hello <!--comment 1--><text-node></text-node><!--comment 2--> and welcome!</p>"`
            );
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "ChildBinding", "queryIndex": 0, "name": "p", "childIndex": 2, "length": 5 },
              ]
            `);
        });

        test('elements with mix of text and interpolators', ({ expect, parser }) => {
            parser.write(`<p>hello `);
            parser.write(`!</p> <p>sum of `);
            parser.write(` and `);
            parser.write(` equals <span>`);
            parser.write(`</span></p> <p>`);
            const { html, bindings } = parser.end(`</p>`);

            expect(html).toMatchInlineSnapshot(`"<p data-bind>hello <text-node></text-node>!</p> <p data-bind>sum of <text-node></text-node> and <text-node></text-node> equals <span data-bind><text-node></text-node></span></p> <p data-bind><text-node></text-node></p>"`);

            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "ChildBinding", "queryIndex": 0, "name": "p", "childIndex": 1, "length": 3 },
                { "type": "ChildBinding", "queryIndex": 1, "name": "p", "childIndex": 1, "length": 6 },
                { "type": "ChildBinding", "queryIndex": 1, "name": "p", "childIndex": 3, "length": 6 },
                { "type": "ChildBinding", "queryIndex": 2, "name": "span", "childIndex": 0, "length": 1 },
                { "type": "ChildBinding", "queryIndex": 3, "name": "p", "childIndex": 0, "length": 1 },
              ]
            `);
        });
    });

    describe('properties', () => {
      
        test('single unquoted attribute', ({ expect, parser }) => {
            parser.write(`<p class=`);
            const { html, bindings } = parser.end(`></p>`);

            expect(html).toMatchInlineSnapshot(`"<p data-bind></p>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "PropertyBinding", "queryIndex": 0, "name": "p", "property": "class" },
              ]
            `);
        });

        test('preceding empty attribute', ({ expect, parser }) => {
            parser.write(`<input required class=`);
            const { html, bindings } = parser.end(`>`);

            expect(html).toMatchInlineSnapshot(`"<input required data-bind>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "class" },
              ]
            `);
        });

        test('single double-quoted attribute', ({ expect, parser }) => {
            parser.write(`<p class="`);
            const { html, bindings } = parser.end(`"></p>`);

            expect(html).toMatchInlineSnapshot(`"<p data-bind></p>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "PropertyBinding", "queryIndex": 0, "name": "p", "property": "class" },
              ]
            `);
        });

        test('single single-quoted attribute', ({ expect, parser }) => {
            parser.write(`<p class='`);
            const { html, bindings } = parser.end(`'></p>`);

            expect(html).toMatchInlineSnapshot(`"<p data-bind></p>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "PropertyBinding", "queryIndex": 0, "name": "p", "property": "class" },
              ]
            `);
        });

        test('multiple attributes with mix of bound, static, and empty', ({ expect, parser }) => {
            parser.write(`<input class=`);
            parser.write(` required name="`);
            parser.write(`" maxLength='`);
            parser.write(`' type='text' disabled=`);
            const { html, bindings } = parser.end(`></p>`);

            expect(html).toMatchInlineSnapshot(`"<input required type="text" data-bind><p></p>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "class" },
                { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "name" },
                { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "maxLength" },
                { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "disabled" },
              ]
            `);
        });

        test('all no quote or empty attributes', ({ expect, parser }) => {
            parser.write(`<input class=`);
            parser.write(` required name=`);
            parser.write(` type=`);
            const { html, bindings } = parser.end(`>`);

            expect(html).toMatchInlineSnapshot(`"<input required data-bind>"`);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "class" },
                { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "name" },
                { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "type" },
              ]
            `);
        });
    });
});


describe('attribute quote handling', () => {

    beforeEach(({ expect }) => addSerializers(expect));

    test('extra space before next quote', ({ expect, parser }) => {
        parser.write(`<input name="`);
        parser.write(`   " type='`);
        const { html, bindings } = parser.end(`   '>`);

        expect(html).toMatchInlineSnapshot(`"<input data-bind>"`);
        expect(bindings).toMatchInlineSnapshot(`
          [
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "name" },
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "type" },
          ]
        `);
    });

    test('extra space before interpolator', ({ expect, parser }) => {
        parser.write(`<input name="  `);
        parser.write(`" type='  `);
        const { html, bindings } = parser.end(`'>`);

        expect(html).toMatchInlineSnapshot(`"<input data-bind>"`);
        expect(bindings).toMatchInlineSnapshot(`
          [
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "name" },
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "type" },
          ]
        `);
    });

    test('no quotes', ({ expect, parser }) => {
        parser.write(`<input class=`);
        parser.write(`required  type=`);
        const { html, bindings } = parser.end(`>`);

        expect(html).toMatchInlineSnapshot(`"<input required data-bind>"`);
        expect(bindings).toMatchInlineSnapshot(`
          [
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "class" },
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "type" },
          ]
        `);
    });

    test('mixed', ({ expect, parser }) => {
        parser.write(`<input class=`);
        parser.write(` name="`);
        parser.write(`   " maxLength='`);
        parser.write(`  ' type="   `);
        parser.write(`" style='   `);
        const { html, bindings } = parser.end(`>`);

        expect(html).toMatchInlineSnapshot(`"<input data-bind>"`);
        expect(bindings).toMatchInlineSnapshot(`
          [
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "class" },
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "name" },
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "maxLength" },
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "type" },
            { "type": "PropertyBinding", "queryIndex": 0, "name": "input", "property": "style" },
          ]
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