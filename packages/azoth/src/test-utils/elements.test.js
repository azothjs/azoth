import { describe, test } from 'vitest';
import { compose } from '../compose/compose.js';
import './with-resolvers-polyfill.js';

export const elements = [
    elementWithTextAnchor,
    elementWithTextAnchorText,
    elementWithAnchor,
    elementWithAnchorText,
];

export function runCompose(value, create) {
    const { dom, anchor } = create();
    compose(value, anchor);
    return dom;
}

export const $anchor = () => document.createComment('0');
export const $div = () => document.createElement('div');
export const $text = (text) => document.createTextNode(text);
export const $helloText = () => $text('Hello');

export function elementWithText(text = 'hello') {
    const dom = $div();
    dom.append($text(text));
    return { dom, anchor: null };
}

export function elementWithTextAnchor() {
    const dom = $div();
    dom.append($helloText(), $anchor());
    return { dom, anchor: dom.lastChild };
}

export function elementWithTextAnchorText() {
    const dom = $div();
    dom.append($helloText(), $anchor(), $helloText());
    return { dom, anchor: dom.firstChild.nextSibling };
}

export function elementWithAnchor() {
    const dom = $div();
    dom.append($anchor());
    return { dom, anchor: dom.firstChild };
}

export function elementWithAnchorText() {
    const dom = $div();
    dom.append($anchor(), $helloText());
    return { dom, anchor: dom.firstChild };
}

describe('element helpers initial anchor and html', () => {

    test('text-anchor', ({ expect }) => {
        expect(elementWithTextAnchorText()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          Hello
          <!--0-->
          Hello
        </div>,
      }
    `);
    });

    test('text-anchor-text', ({ expect }) => {
        expect(elementWithTextAnchorText()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          Hello
          <!--0-->
          Hello
        </div>,
      }
    `);
    });

    test('anchor', ({ expect }) => {
        expect(elementWithAnchor()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          <!--0-->
        </div>,
      }
    `);
    });

    test('anchor-text', ({ expect }) => {
        expect(elementWithAnchorText()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          <!--0-->
          Hello
        </div>,
      }
    `);
    });

});