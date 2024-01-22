// @vitest-environment jsdom
import { beforeEach, describe, test } from 'vitest';
import { compose } from './compose.js';

const elements = [
    elementWithTextAnchor,
    elementWithTextAnchorText,
    elementWithAnchor,
    elementWithAnchorText,
];

describe('compose', () => {
    describe.each(elements)('create %o', (create) => {
        beforeEach(async (context) => {
            const { expect } = context;
            const { dom, anchor } = create();
            expect(dom).toBeDefined();
            expect(anchor).toBeInstanceOf(Comment);
            context.anchor = anchor;
            context.initial = dom.outerHTML;
            context.getCurrent = () => dom.outerHTML;
        });


        [undefined, null, true, false, ''].forEach(value => {
            test(`with "${value}" is no mutation`, ({ expect, getCurrent, initial, anchor }) => {
                expect(getCurrent()).toBe(initial);
                compose(value, anchor);
                expect(getCurrent()).toBe(initial);
            });
        });
    });
});
        
function runForName(create) {
    const name = create.name;

    describe(`compose: ${name}`, () => {
        

        ['text'].forEach(value => {
            test(`mutation: "${value}"`, ({ expect, getCurrent, initial, anchor }) => {
                compose(value, anchor);
                expect(getCurrent()).toBe(initial);
            });
        });


    });

}


const $anchor = () => document.createComment(0);
const $div = () => document.createElement('div');
const $helloText = () => document.createTextNode('Hello');

function elementWithTextAnchor() {
    const dom = $div();
    dom.append($helloText(), $anchor());
    return { dom, anchor: dom.lastChild };
}
test('el: text anchor', ({ expect }) => {
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

function elementWithTextAnchorText() {
    const dom = $div();
    dom.append($helloText(), $anchor(), $helloText());
    return { dom, anchor: dom.firstChild.nextSibling };
}
test('el: text anchor text', ({ expect }) => {
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

function elementWithAnchor() {
    const dom = $div();
    dom.append($anchor());
    return { dom, anchor: dom.firstChild };
}
test('el: anchor', ({ expect }) => {
    expect(elementWithAnchor()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          <!--0-->
        </div>,
      }
    `);
});

function elementWithAnchorText() {
    const dom = $div();
    dom.append($anchor(), $helloText());
    return { dom, anchor: dom.firstChild };
}
test('el: anchor text', ({ expect }) => {
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
