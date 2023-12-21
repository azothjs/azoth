import { beforeEach, describe, test, } from 'vitest';
import { parse } from '.';
import addSerializers from './ast-serializers.js';
import { toMatchCode } from '../../utils/code-matchers.js';

const options = { ecmaVersion: 'latest' };
const parseTemplate = (code) => {
    if(code.toBody) code = code.toBody();
    const ast = parse(code, options);
    // remove preamble nodes
    return ast.body[0].expression.template;
};

describe('static html', () => {

    beforeEach(async (context) => {
        const { expect } = context;
        context.firstQuasi = html => {
            const { quasis } = parseTemplate(html);
            expect(quasis.length).toBe(1);
            const [{ type, tail, value }] = quasis;
            expect(type).toBe('TemplateElement');
            expect(tail).toBe(true);
            return value.raw;
        };
    });

    test('simple text content', ({ expect, firstQuasi }) => {
        const code = firstQuasi(`#\`hi\``);
        expect(code).toMatchInlineSnapshot(`"hi"`);
    });
        
    test('element with class and text content', ({ expect, firstQuasi }) => {
        const code = `#\`<span class="greeting">hello world</span>\``;
        expect(firstQuasi(code)).toMatchInlineSnapshot(
            `"<span class="greeting">hello world</span>"`
        );
    });

    test('void and self-closing elements', ({ expect, firstQuasi }) => {
        const code = `#\`
            <br>
            <br/>
            <self-closing/>
            <self-closing/>text
            <self-closing></self-closing>
            <div></div>
            <div>text</div>        
        \``;

        expect(firstQuasi(code)).toMatchInlineSnapshot(`
          "
                      <br>
                      <br/>
                      <self-closing/>
                      <self-closing/>text
                      <self-closing></self-closing>
                      <div></div>
                      <div>text</div>        
                  "
        `);
    });

    test('nested elements', ({ expect, firstQuasi }) => {
        const code = `#\`<div><div><div><div><div></div></div></div></div></div>\``;
        expect(firstQuasi(code)).toMatchInlineSnapshot(
            `"<div><div><div><div><div></div></div></div></div></div>"`
        );
    });

    test('html comments are copied', ({ expect, firstQuasi }) => {
        const code = `#\`<span class="greeting"><!--hello--> world</span>\``;
        expect(firstQuasi(code)).toMatchInlineSnapshot(
            `"<span class="greeting"><!--hello--> world</span>"`
        );
    });

    // TODO: handle html parsing possible errors...

});

describe('bindings', () => {

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

    test.only('simple template with single {...} interpolator', ({ expect, templatize }) => {
        const { expressions, quasis } = templatize(`
            #\`
                <div>    
                    <p>hello \${name}!</p>
                    <p>count: <span>{count}</span></p>
                    <p>{x} + {y} = {x + y}</p>
                    <p>#{ block }</p>
                </div>
            \`;
        `);

        expect(expressions).toMatchInlineSnapshot(`undefined`);
        
        expect(quasis).toMatchInlineSnapshot(`
          [
            "
                          <div>    
                              <p>hello ",
            "!</p>
                              <p>count: <span>",
            "</span></p>
                              <p>",
            " + ",
            " = ",
            "</p>
                              <p>",
            "</p>
                          </div>
                      ",
          ]
        `);
    });

    test.skip('block with 4 child node interpolators bound to 3 elements', ({ expect, templatize }) => {
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

    test.skip('property bynders', ({ expect }) => {
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

    test.skip('property binders 2', ({ expect }) => {
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