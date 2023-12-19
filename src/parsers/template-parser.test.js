import { beforeEach, describe, test } from 'vitest';
import { Parser } from 'acorn';
import acornAz from '../parsers/acorn-azoth/acorn-az.js';
import { parse } from './template-parser.js';
import addSerializers from './acorn-azoth/ast-serializers.js';
import { toMatchCode } from '../utils/code-matchers.js';

const _ = () => {};
const AzParser = Parser.extend(acornAz());

const parseTemplate = (code) => {
    if(code.toBody) code = code.toBody();
    const ast = AzParser.parse(code, {
        ecmaVersion: 'latest',
    });

    // remove preamble nodes
    const template = ast.body[0].expression;
    return parse(template);
};

const getQuasis = code => parseTemplate(code).template.quasis;
const getHtml = (code) => parseTemplate(code).html;

beforeEach(async ({ expect }) => {
    expect.extend(toMatchCode);
    addSerializers(expect, { excludeKeys: ['type', 'start', 'end'] });
});

describe.concurrent('static html handling in templates', () => {
    test('element with class and text content', ({ expect }) => {
        function t1() {
            _/*html*/`
                <span class="greeting">hello world</span>
            `;
        }
        const quasis = getQuasis(t1);
        expect(quasis).toMatchInlineSnapshot();
    });

    test('void and self-closing elements', ({ expect }) => {
        function t1() {
            _/*html*/`
                <br>
                <br/>
                <self-closing/>
                <self-closing/>text
                <self-closing></self-closing>
                <div></div>
                <div>text</div>
            `;
        }
        const quasis = getQuasis(t1);

        expect(quasis).toMatchInlineSnapshot([
            `<br>
                <br>
                <self-closing>/
                <self-closing>/text
                <self-closing></self-closing>
                <div></div>
                <div>text</div>`,
        ]);
    });

    test('nested elements', ({ expect }) => {
        function t1() {
            _/*html*/`
                <div><div><div><div><div></div></div></div></div></div>
            `;
        }
        const quasis = getQuasis(t1);
    
        expect(quasis).toMatchInlineSnapshot([
            '<div><div><div><div><div></div></div></div></div></div>',
        ]);
    });

    test('html comments are copied', ({ expect }) => {
        function t1() {
            _/*html*/`
              <span class="greeting"><!--hello--> world</span>
          `;
        }
        const quasis = getQuasis(t1);
        expect(quasis).toMatchInlineSnapshot(`
          [
            "<span class="greeting"> world</span>",
          ]
        `);
    });

    // TODO: handle html parsing possible errors
});

describe('Bindings', () => {

    test('block with 4 child node interpolators bound to 3 elements', ({ expect }) => {
        addSerializers(expect, { 
            excludeKeys: ['type', 'start', 'end', 'quasis'] 
        });
        
        const code = `
            _\`
            <div>    
                <p>hello \${name}!</p>
                <p>count: <span>{count}</span></p>
                <p>{x} + {y} = {x + y}</p>
                <p>#{ block }</p>
            </div>
            \`;
        `;
        
        const ast = parseTemplate(code);
        
        expect(ast).toMatchInlineSnapshot(`
          Node {
            "end": 236,
            "start": 13,
            "template": Node {
              "bindings": [
                Node {
                  "binder": "\${",
                  "childIndex": 1,
                  "element": {
                    "childrenLength": 3,
                    "name": "p",
                  },
                  "end": 70,
                  "expression": Node {
                    "end": 69,
                    "name": "name",
                    "start": 65,
                    "type": "Identifier",
                  },
                  "queryIndex": 0,
                  "start": 63,
                  "type": "AzothBinding",
                },
                Node {
                  "binder": "{",
                  "childIndex": 0,
                  "element": {
                    "childrenLength": 1,
                    "name": "span",
                  },
                  "end": 115,
                  "expression": Node {
                    "end": 114,
                    "name": "count",
                    "start": 109,
                    "type": "Identifier",
                  },
                  "queryIndex": 1,
                  "start": 108,
                  "type": "AzothBinding",
                },
                Node {
                  "binder": "{",
                  "childIndex": 0,
                  "element": {
                    "childrenLength": 5,
                    "name": "p",
                  },
                  "end": 149,
                  "expression": Node {
                    "end": 148,
                    "name": "x",
                    "start": 147,
                    "type": "Identifier",
                  },
                  "queryIndex": 2,
                  "start": 146,
                  "type": "AzothBinding",
                },
                Node {
                  "binder": "{",
                  "childIndex": 2,
                  "element": {
                    "childrenLength": 5,
                    "name": "p",
                  },
                  "end": 155,
                  "expression": Node {
                    "end": 154,
                    "name": "y",
                    "start": 153,
                    "type": "Identifier",
                  },
                  "queryIndex": 2,
                  "start": 152,
                  "type": "AzothBinding",
                },
                Node {
                  "binder": "{",
                  "childIndex": 4,
                  "element": {
                    "childrenLength": 5,
                    "name": "p",
                  },
                  "end": 165,
                  "expression": Node {
                    "end": 164,
                    "left": Node {
                      "end": 160,
                      "name": "x",
                      "start": 159,
                      "type": "Identifier",
                    },
                    "operator": "+",
                    "right": Node {
                      "end": 164,
                      "name": "y",
                      "start": 163,
                      "type": "Identifier",
                    },
                    "start": 159,
                    "type": "BinaryExpression",
                  },
                  "queryIndex": 2,
                  "start": 158,
                  "type": "AzothBinding",
                },
                Node {
                  "binder": "#{",
                  "childIndex": 0,
                  "element": {
                    "childrenLength": 1,
                    "name": "p",
                  },
                  "end": 199,
                  "expression": Node {
                    "end": 197,
                    "name": "block",
                    "start": 192,
                    "type": "Identifier",
                  },
                  "queryIndex": 3,
                  "start": 189,
                  "type": "AzothBinding",
                },
              ],
              "end": 236,
              "quasis": [
                "<div>    
                          <p>hello /<div>    
                          <p data-bind>hello ",
                "<child-node></child-node>",
                "!</p>
                          <p>count: <span data-bind><child-node></child-node>",
                "</span></p>
                          <p data-bind><child-node></child-node>",
                " + <child-node></child-node>",
                " = <child-node></child-node>",
                "</p>
                          <p data-bind><child-node></child-node>",
                "</p>
                      </div>/",
              ],
              "start": 13,
              "type": "TemplateLiteral",
            },
            "type": "AzothTemplate",
          }
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