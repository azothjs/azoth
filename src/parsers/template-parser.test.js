import { describe, test } from 'vitest';
import { parse } from './template-parser.js';
import '../utils/code-matchers.js';
import { Parser } from 'acorn';
import acornAz from '../parsers/acorn-azoth/acorn-az.js';
import addSerializers from './acorn-azoth/ast-serializers.js';

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

const getHtml = (code) => parseTemplate(code).html;

describe('basic html handling in templates', () => {
    test('single span with class and text content', ({ expect }) => {
        function t1() {
            _/*html*/`
                <span class="greeting">hello world</span>
            `;
        }
        const ast = parseTemplate(t1);
        expect(ast).toMatchInlineSnapshot(`
          Node {
            "end": 82,
            "start": 0,
            "template": Node {
              "bindings": [],
              "end": 82,
              "quasis": [
                "<span class="greeting">hello world</span>
                      ",
              ],
              "start": 0,
              "type": "TemplateLiteral",
            },
            "type": "AzothTemplate",
          }
        `);
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
        const html = getHtml(t1);

        expect(html).toMatchInlineSnapshot(`undefined`);
    });

    test('nested elements', ({ expect }) => {
        function t1() {
            _/*html*/`
                <div><div><div><div><div></div></div></div></div></div>
            `;
        }
        const html = getHtml(t1);
    
        expect(html).toMatchInlineSnapshot(`undefined`);
    });

    test('html comments are copied', ({ expect }) => {
        function t1() {
            _/*html*/`
              <span class="greeting"><!--hello--> world</span>
          `;
        }
        const html = getHtml(t1);
        expect(html).toMatchInlineSnapshot(`undefined`);
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
          AzothTemplate
            template:   TemplateLiteral
              bindings: [
                AzothBinding
                  binder: '\${'
                  queryIndex: 0
                  childIndex: 1
                  expression: 'name'
                  element:         
                    name: 'p'
                    childrenLength: 3
                AzothBinding
                  binder: '{'
                  queryIndex: 1
                  childIndex: 0
                  expression: 'count'
                  element:         
                    name: 'span'
                    childrenLength: 1
                AzothBinding
                  binder: '{'
                  queryIndex: 2
                  childIndex: 0
                  expression: 'x'
                  element:         
                    name: 'p'
                    childrenLength: 5
                AzothBinding
                  binder: '{'
                  queryIndex: 2
                  childIndex: 2
                  expression: 'y'
                  element:         
                    name: 'p'
                    childrenLength: 5
                AzothBinding
                  binder: '{'
                  queryIndex: 2
                  childIndex: 4
                  expression: 'x + y'
                  element:         
                    name: 'p'
                    childrenLength: 5
                AzothBinding
                  binder: '#{'
                  queryIndex: 3
                  childIndex: 0
                  expression: 'block'
                  element:         
                    name: 'p'
                    childrenLength: 1
              ]
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
          AzothTemplate
            template:   TemplateLiteral
              bindings: [
                AzothBinding
                  binder: '{'
                  queryIndex: 0
                  expression: 'type'
                  element:         
                    name: 'p'
                    childrenLength: 1
                AzothBinding
                  binder: '{'
                  queryIndex: 0
                  propertyKey: 'class'
                  expression: 'isRequired'
                  element:         
                    name: 'p'
                    childrenLength: 1
                AzothBinding
                  binder: '{'
                  queryIndex: 1
                  expression: 'sectionType'
                  element:         
                    name: 'div'
                    childrenLength: 0
              ]
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