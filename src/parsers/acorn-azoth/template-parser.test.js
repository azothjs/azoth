import { beforeEach, describe, test, } from 'vitest';
import { getParser } from './template-parser.js';
 
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

    test('html comments removed', ({ expect, parser }) => {
        const template = parser.end(`<span class="greeting"><!--hello--> world</span>`);
        expect(template).toMatchInlineSnapshot(`
          {
            "bindings": [],
            "quasis": [
              "<span class="greeting"> world</span>",
            ],
          }
        `);

    });
});



describe('bindings', () => {

    beforeEach(({ expect }) => {
        expect.addSnapshotSerializer({
            test(val) {
                return !Array.isArray(val) && typeof val === 'object';
            },
            serialize(object, config, indent, deps, refs, printer) {
                const serialized = JSON
                    .stringify(object, null, '')
                    .replace(/[,|:|{](?!$)/gm, match => `${match} `);
                // console.log(serialized);
                return printer(serialized, config, indent, deps, refs);
            }
        });
    });

    test('single element with child text interpolator in children', ({ expect, parser }) => {
        // <p>hello {name}!</p>
        parser.write(`<p>hello `);
        const { quasis, bindings } = parser.end(`!</p>`);

        expect(quasis).toMatchInlineSnapshot(`
          [
            "<p data-bind>hello ",
            "<!--child[1]-->!</p>",
          ]
        `);
        expect(bindings).toMatchInlineSnapshot(`
          [
            "{ "name": "p", "length": 3, "queryIndex": 0, "index": 1}",
          ]
        `);
    });

    test('elements with child node interpolators', ({ expect, parser }) => {
        parser.write(`<p>hello `);
        parser.write(`!</p> <p>sum of `);
        parser.write(` and `);
        parser.write(` equals <span>`);
        parser.write(`</span></p> <p>`);
        const { quasis, bindings } = parser.end(`</p>`);

        expect(quasis).toMatchInlineSnapshot(`
          [
            "<p data-bind>hello ",
            "<!--child[1]-->!</p> <p data-bind>sum of ",
            "<!--child[1]--> and ",
            "<!--child[3]--> equals <span data-bind>",
            "<!--child[0]--></span></p> <p data-bind>",
            "<!--child[0]--></p>",
          ]
        `);

        expect(bindings).toMatchInlineSnapshot(`
          [
            "{ "name": "p", "length": 3, "queryIndex": 0, "index": 1}",
            "{ "name": "p", "length": 6, "queryIndex": 1, "index": 1}",
            "{ "name": "p", "length": 6, "queryIndex": 1, "index": 3}",
            "{ "name": "span", "length": 1, "queryIndex": 2, "index": 0}",
            "{ "name": "p", "length": 1, "queryIndex": 3, "index": 0}",
          ]
        `);
    });
});