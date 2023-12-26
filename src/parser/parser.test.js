import { beforeEach, describe, test, } from 'vitest';
import { parse } from './index.js';
import { toMatchCode } from '../utils/code-matchers.js';

const options = { ecmaVersion: 'latest' };
const parseTemplate = (code) => {
    if(code.toBody) code = code.toBody();
    const ast = parse(code, options);
    // remove preamble nodes
    const node = ast.body[0].expression;
    return node;
};

describe('expressions', () => {

    beforeEach(async (context) => {
        const { expect } = context;
        expect.extend(toMatchCode);
        context.templatize = code => {
            const { expressions, quasis } = parseTemplate(code);
            return {
                expressions,
                quasis: quasis.map(q => q.value.raw)
            };
        };
    });

    test('simple template with single {...} interpolator', ({ expect, templatize }) => {
        const { expressions, quasis } = templatize(/*html*/`#\`<p>hello {name}!</p>\``);

        expect(expressions).toMatchInlineSnapshot(`
          [
            Node {
              "end": 16,
              "name": "name",
              "start": 12,
              "type": "Identifier",
            },
          ]
        `);
        
        expect(quasis).toMatchInlineSnapshot(`
          [
            "<p>hello ",
            "!</p>",
          ]
        `);
    });

    test('template with ${...}, {...}, and #{...} interpolators', ({ expect, templatize }) => {
        const { expressions, quasis } = templatize(/*html*/`
            #\`
                <p>hello \${name}!</p>
                <p>count: <span>{count}</span></p>
                <p>#{ block }</p>
            \`
        `);

        expect(expressions).toMatchInlineSnapshot(`
          [
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
          ]
        `);
        
        expect(quasis).toMatchInlineSnapshot(`
          [
            "
                          <p>hello ",
            "!</p>
                          <p>count: <span>",
            "</span></p>
                          <p>",
            "</p>
                      ",
          ]
        `);
    });

    test('template with complex expression in interpolator', ({ expect, templatize }) => {
        const { expressions, quasis } = templatize(/*html*/`
            #\`<p>{x} + {y} = {x + y}</p>\`
        `);

        expect(expressions).toMatchInlineSnapshot(`
          [
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
          ]
        `);
        
        expect(quasis).toMatchInlineSnapshot(`
          [
            "<p>",
            " + ",
            " = ",
            "</p>",
          ]
        `);
    });

    test.skip('property binders 1', ({ expect }) => {
        // addSerializers(expect, { 
        //     excludeKeys: ['type', 'start', 'end', 'quasis'] 
        // });
        
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
                "<p class=null<p null data-bind name="title"",
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

    test.skip('property binders 2', ({ expect }) => {
        // addSerializers(expect, { 
        //     excludeKeys: ['type', 'start', 'end', 'quasis'] 
        // });
        
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
        // addSerializers(expect, { 
        //     excludeKeys: ['type', 'start', 'end', 'quasis'] 
        // });
        
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