import { beforeEach, describe, test, } from 'vitest';
import { getParser } from './template-parser.js';
import { addSerializers } from './serializers.js';
 
beforeEach(context => {
    context.parser = getParser();
});

describe('static html', () => {
    
    test('plain text', ({ expect, parser }) => {
        const template = parser.end('hi');
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "quasis": [
              "hi",
            ],
          }
        `);
    });
        
    test('attributes', ({ expect, parser }) => {
        const template = parser.end(`<input name="cat" required class=cool type='text'>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "quasis": [
              "<input name="cat" required class=cool type='text'>",
            ],
          }
        `);
    });

    test('element with class and text content', ({ expect, parser }) => {
        const template = parser.end(`<span class="greeting">hello world</span>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "quasis": [
              "<span class="greeting">hello world</span>",
            ],
          }
        `);
    });

    test('self-closing element converted to real HTML element', ({ expect, parser }) => {
        const template = parser.end(`<self-closing/>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "quasis": [
              "<self-closing></self-closing>",
            ],
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
            "quasis": [
              "
                      <br>
                      <br>
                      <self-closing></self-closing>text
                      <custom-element></custom-element>
                      <div></div>
                      <div>text</div>        
                  ",
            ],
          }
        `);
    });
    
    test('nested elements', ({ expect, parser }) => {
        const template = parser.end(`<div><div><div><div><div></div></div></div></div></div>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "quasis": [
              "<div><div><div><div><div></div></div></div></div></div>",
            ],
          }
        `);
    });

    test('html comments', ({ expect, parser }) => {
        const template = parser.end(`<span class="greeting"><!--hello--> world</span>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "quasis": [
              "<span class="greeting"><!--hello--> world</span>",
            ],
          }
        `);

    });
});

describe('bindings', () => {

    beforeEach(({ expect }) => addSerializers(expect));

    describe('child nodes', () => {
      
        test('empty root', ({ expect, parser }) => {
            parser.write(``);
            const { quasis, bindings } = parser.end(``);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<!--child[0]-->"
              ]
            `);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "<>", "index": 0, "length": 1 },
              ]
            `);
        });
      
        test('element with text and interpolator', ({ expect, parser }) => {
            parser.write(`<p>hello `);
            const { quasis, bindings } = parser.end(`!</p>`);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<p data-bind>hello "
                "<!--child[1]-->!</p>"
              ]
            `);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "p", "index": 1, "length": 3 },
              ]
            `);
        });

        test('element with text, html comment, interpolator', ({ expect, parser }) => {
            parser.write(`<p>hello <!--comment 1-->`);
            const { quasis, bindings } = parser.end(`<!--comment 2--> and welcome!</p>`);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<p data-bind>hello <!--comment 1-->"
                "<!--child[2]--><!--comment 2--> and welcome!</p>"
              ]
            `);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "p", "index": 2, "length": 5 },
              ]
            `);
        });

        test('elements with mix of text and interpolators', ({ expect, parser }) => {
            parser.write(`<p>hello `);
            parser.write(`!</p> <p>sum of `);
            parser.write(` and `);
            parser.write(` equals <span>`);
            parser.write(`</span></p> <p>`);
            const { quasis, bindings } = parser.end(`</p>`);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<p data-bind>hello "
                "<!--child[1]-->!</p> <p data-bind>sum of "
                "<!--child[1]--> and "
                "<!--child[3]--> equals <span data-bind>"
                "<!--child[0]--></span></p> <p data-bind>"
                "<!--child[0]--></p>"
              ]
            `);

            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "p", "index": 1, "length": 3 },
                { "queryIndex": 1, "name": "p", "index": 1, "length": 6 },
                { "queryIndex": 1, "name": "p", "index": 3, "length": 6 },
                { "queryIndex": 2, "name": "span", "index": 0, "length": 1 },
                { "queryIndex": 3, "name": "p", "index": 0, "length": 1 },
              ]
            `);
        });
    });

    describe('properties', () => {
      
        test('single unquoted attribute', ({ expect, parser }) => {
            parser.write(`<p class=`);
            const { quasis, bindings } = parser.end(`></p>`);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<p data-bind"
                "></p>"
              ]
            `);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "p", "property": "class" },
              ]
            `);
        });

        test('preceding empty attribute', ({ expect, parser }) => {
            parser.write(`<input required class=`);
            const { quasis, bindings } = parser.end(`>`);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<input required data-bind"
                ">"
              ]
            `);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "input", "property": "class" },
              ]
            `);
        });

        test('single double-quoted attribute', ({ expect, parser }) => {
            parser.write(`<p class="`);
            const { quasis, bindings } = parser.end(`"></p>`);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<p data-bind"
                "></p>"
              ]
            `);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "p", "property": "class" },
              ]
            `);
        });

        test('single single-quoted attribute', ({ expect, parser }) => {
            parser.write(`<p class='`);
            const { quasis, bindings } = parser.end(`'></p>`);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<p data-bind"
                "></p>"
              ]
            `);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "p", "property": "class" },
              ]
            `);
        });

        test('mix of attribute use cases including static and bound attributes', ({ expect, parser }) => {
            parser.write(`<input class=`);
            parser.write(` required name="`);
            parser.write(`" maxLength='`);
            parser.write(`"' type='text' disabled=`);
            const { quasis, bindings } = parser.end(`></p>`);

            expect(quasis).toMatchInlineSnapshot(`
              [
                "<input required "' type='text' data-bind"
                "><p></p>"
              ]
            `);
            expect(bindings).toMatchInlineSnapshot(`
              [
                { "queryIndex": 0, "name": "input", "property": "class" },
                { "queryIndex": 0, "name": "input", "property": "name" },
                { "queryIndex": 0, "name": "input", "property": "maxlength" },
                { "queryIndex": 0, "name": "input", "property": "disabled" },
              ]
            `);
        });
    });
});