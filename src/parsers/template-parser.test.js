import { beforeEach, describe, test } from 'vitest';
import { Parser } from 'acorn';
import acornAz from '../parsers/acorn-azoth';
import { parse } from './template-parser.js';
import addSerializers from './acorn-azoth/ast-serializers.js';
import { toMatchCode } from '../utils/code-matchers.js';
import htmlPretty from 'jest-serializer-html';

const _ = () => {};
const AzParser = Parser.extend(acornAz());

const parseTemplate = (code) => {
    if(code.toBody) code = code.toBody();
    const ast = AzParser.parse(code, {
        ecmaVersion: 'latest',
    });

    // remove preamble nodes
    const template = ast.body[0].expression;
    return parse(template, {
        smartTrim: false
    });
};

const getQuasis = tmpl => parseTemplate(tmpl).template.quasis;
const getQuasis2 = ast => ast.template.quasis;
const getHtml = (code) => parseTemplate(code).html;

beforeEach(async ({ expect }) => {
    expect.extend(toMatchCode);
    // expect.addSnapshotSerializer(htmlPretty);
    // addSerializers(expect, { excludeKeys: ['type', 'start', 'end'] });
});

describe.skip('static html', () => {
    test('element with class and text content', ({ expect }) => 
        expect(getQuasis(() => _/*html*/`

            <span class="greeting">hello world</span>

        `)).toMatchInlineSnapshot(`
          [
            "<span class="greeting">hello world</span>",
          ]
        `)
    );

    test('void and self-closing elements', ({ expect }) => {
        expect(getQuasis(() => _/*html*/`            
            <br>
            <br/>
            <self-closing/>
            <self-closing/>text
            <self-closing></self-closing>
            <div></div>
            <div>text</div>
           
        `)).toMatchInlineSnapshot(`
          [
            "<br>
                      <br>
                      <self-closing>/
                      <self-closing>/text
                      <self-closing></self-closing>
                      <div></div>
                      <div>text</div>",
          ]
        `);
    });

    test('nested elements', ({ expect }) => {
        expect(getQuasis(() => _/*html*/`

            <div><div><div><div><div></div></div></div></div></div>
        
        `)).toMatchInlineSnapshot(`
          [
            "<div><div><div><div><div></div></div></div></div></div>",
          ]
        `);
    });

    test('html comments are copied', ({ expect }) => {
        expect(getQuasis(() => _/*html*/`

            <span class="greeting"><!--hello--> world</span>
        
        `)).toMatchInlineSnapshot(`
          [
            "<span class="greeting"><!--hello--> world</span>",
          ]
        `);
    });

    // TODO: handle html parsing possible errors...

});

describe.skip('bindings', () => {

    beforeEach(async ({ expect }) => {
        // expect.addSnapshotSerializer(htmlPretty);
        // addSerializers(expect, { 
        //     excludeKeys: ['type', 'start', 'end', 'quasis'] 
        // });
    });

    test('block with 4 child node interpolators bound to 3 elements', ({ expect }) => {
        const t = () => {
            _/*html*/`
                <div>    
                    <p>hello ${name}!</p>
                    <p>count: <span>{count}</span></p>
                    <p>{x} + {y} = {x + y}</p>
                    <p>#{ block }</p>
                </div>
            `;
        };
        
        
        const ast = parseTemplate(t);
        const quasis = getQuasis2(ast);

        expect(quasis.join('')).toMatchInlineSnapshot(`
          "<div>    
                              <p>hello /<div>    
                              <p data-bind>hello <child-node></child-node>!</p>
                              <p>count: <span data-bind><child-node></child-node></span></p>
                              <p data-bind><child-node></child-node> + <child-node></child-node> = <child-node></child-node></p>
                              <p data-bind><child-node></child-node></p>
                          </div>/"
        `);
    });

    test('property bynders', ({ expect }) => {
        addSerializers(expect, { 
            excludeKeys: ['type', 'start', 'end', 'quasis'] 
        });
        
        const code = `
            _\`
                <p class={type}>hello!</p>
                <input required={isRequired} name="title">
                <div style="color: red" class={sectionType}></div>
            \`;
        `;
        
        const ast = parseTemplate(code);
        
        expect(ast).toMatchInlineSnapshot(`
          Node {
            "end": 198,
            "start": 13,
            "template": Node {
              "bindings": [
                Node {
                  "binder": "{",
                  "element": {
                    "childrenLength": 1,
                    "name": "p",
                  },
                  "end": 47,
                  "expression": Node {
                    "end": 46,
                    "name": "type",
                    "start": 42,
                    "type": "Identifier",
                  },
                  "queryIndex": 0,
                  "start": 41,
                  "type": "AzothBinding",
                },
                Node {
                  "binder": "{",
                  "element": {
                    "childrenLength": 1,
                    "name": "p",
                  },
                  "end": 103,
                  "expression": Node {
                    "end": 102,
                    "name": "isRequired",
                    "start": 92,
                    "type": "Identifier",
                  },
                  "propertyKey": "class",
                  "queryIndex": 0,
                  "start": 91,
                  "type": "AzothBinding",
                },
                Node {
                  "binder": "{",
                  "element": {
                    "childrenLength": 0,
                    "name": "div",
                  },
                  "end": 177,
                  "expression": Node {
                    "end": 176,
                    "name": "sectionType",
                    "start": 165,
                    "type": "Identifier",
                  },
                  "queryIndex": 1,
                  "start": 164,
                  "type": "AzothBinding",
                },
              ],
              "end": 198,
              "quasis": [
                "<p class=null<pnull data-bind name="title"",
                ">
                          /<div style="color: red" data-bind",
                "/",
              ],
              "start": 13,
              "type": "TemplateLiteral",
            },
            "type": "AzothTemplate",
          }
        `);
    });

    test('property binders 2', ({ expect }) => {
        addSerializers(expect, { 
            excludeKeys: ['type', 'start', 'end', 'quasis'] 
        });
        
        const code = `
            _\`<div style="color: red" class="{sectionType}"></div>\`;
        `;
        
        const ast = parseTemplate(code);
        
        expect(ast).toMatchInlineSnapshot(`
          Node {
            "end": 68,
            "start": 13,
            "template": Node {
              "bindings": [
                Node {
                  "binder": "{",
                  "element": {
                    "childrenLength": 0,
                    "name": "div",
                  },
                  "end": 59,
                  "expression": Node {
                    "end": 58,
                    "name": "sectionType",
                    "start": 47,
                    "type": "Identifier",
                  },
                  "propertyKey": "class",
                  "queryIndex": 0,
                  "start": 46,
                  "type": "AzothBinding",
                },
              ],
              "end": 68,
              "quasis": [
                "<div style="color: red" class="<div style=" color: red" data-bind",
                "></div>",
              ],
              "start": 13,
              "type": "TemplateLiteral",
            },
            "type": "AzothTemplate",
          }
        `);
    });

    test.skip('nested template', ({ expect }) => {
        addSerializers(expect, { 
            excludeKeys: ['type', 'start', 'end', 'quasis'] 
        });
        
        const code = `
            _\`<p>#{ isVip ? _\`<span>VIP</span>\` : _\`guest\` }</p>\`;
        `;
        
        const ast = parseTemplate(code);
        
        expect(ast).toMatchInlineSnapshot(`
                    AzothTemplate
                      template:   TemplateLiteral
                        bindings: [
                          AzothBinding
                            binder: '{'
                            queryIndex: 0
                            propertyKey: 'class'
                            expression: 'sectionType'
                            element:         
                              name: 'div'
                              childrenLength: 0
                        ]
                  `);
    });

});