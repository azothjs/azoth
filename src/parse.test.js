import { describe, expect, test } from 'vitest';
import { getTemplatesAst } from './utils/get-templates.js';
import { parse } from './parse.js';
import './utils/code-matchers.js';


const _ = () => {};

const getHtml = (wrapperFn) => {
    const [ast] = getTemplatesAst(wrapperFn);
    const { html } = parse(ast);
    return html;
};

describe('basic html handling in templates', () => {
    test('single span with class and text content', () => {
        function t1() {
            _/*html*/`
                <span class="greeting">hello world</span>
            `;
        }
        const html = getHtml(t1);
        expect(html).toMatchInlineSnapshot(`"<span class="greeting">hello world</span>"`);
    });

    test('void and self-closing elements', () => {
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

        expect(html).toMatchInlineSnapshot(`
          "<br>
                          <br>
                          <self-closing/>
                          <self-closing/>text
                          <self-closing></self-closing>
                          <div></div>
                          <div>text</div>"
        `);
    });

    test('nested elements', () => {
        function t1() {
            _/*html*/`
                <div><div><div><div><div></div></div></div></div></div>
            `;
        }
        const html = getHtml(t1);
    
        expect(html).toMatchInlineSnapshot(`"<div><div><div><div><div></div></div></div></div></div>"`);
    });

    // TODO: html parsing  possible errors
});

describe.skip('text bindings', () => {

    test.only('span with one static and one bound text node', () => {
        function t1() {
            name => _`
                <span>hello ${name}</span>
            `;
        }
        const html = getHtml(t1);
        expect(html).toMatchInlineSnapshot(`"<span data-bind>hello <text-node/></span>"`);
    });

});