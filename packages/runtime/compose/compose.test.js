import { describe, test } from 'vitest';
import { IGNORE, compose } from './compose.js';
import { elements, elementWithAnchor, elementWithText, $anchor } from 'test-utils/elements';

export function runCompose(value, create) {
    const { dom, anchor } = create();
    compose(anchor, value);
    return dom;
}

export function run(value, create) {
    return runCompose(value, create).outerHTML;
}

describe('append and remove', () => {

    test('surrounding sibling content', ({ expect }) => {
        const value = 'World';
        const results = elements.map(create => {
            return `${create.name.padEnd(28, ' ')}${run(value, create)}`;
        });

        expect(results).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor       <div>HelloWorld<!--1--></div>",
            "elementWithTextAnchorText   <div>HelloWorld<!--1-->Hello</div>",
            "elementWithAnchor           <div>World<!--1--></div>",
            "elementWithAnchorText       <div>World<!--1-->Hello</div>",
          ]
        `);
    });

    test('compose replaces prior', ({ expect }) => {
        const { dom, anchor } = elementWithAnchor();

        compose(anchor, 'first');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            first
            <!--1-->
          </div>
        `);

        compose(anchor, 'second');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            second
            <!--1-->
          </div>
        `);

        compose(anchor, ['third', 'fourth', 'fifth']);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            third
            fourth
            fifth
            <!--3-->
          </div>
        `);

        compose(anchor, 'sixth');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            sixth
            <!--1-->
          </div>
        `);

    });

    test('nested anchors', ({ expect }) => {
        const { dom, anchor: parent } = elementWithAnchor();
        const anchor = $anchor();
        compose(parent, anchor);

        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
            <!--1-->
          </div>
        `);

        compose(anchor, elementWithText().dom);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <div>
              hello
            </div>
            <!--1-->
            <!--1-->
          </div>
        `);

        const anchor2 = $anchor();
        compose(parent, anchor2);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
            <!--1-->
          </div>
        `);

        compose(anchor2, elementWithText('goodbye').dom);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <div>
              goodbye
            </div>
            <!--1-->
            <!--1-->
          </div>
        `);

    });

    test('IGNORE', ({ expect }) => {
        const { dom, anchor } = elementWithAnchor();
        compose(anchor, 'first');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            first
            <!--1-->
          </div>
        `);

        compose(anchor, IGNORE);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            first
            <!--1-->
          </div>
        `);

        compose(anchor, 'third');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            third
            <!--1-->
          </div>
        `);

        compose(anchor);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
          </div>
        `);
    });

});


describe('throws on invalid types', () => {

    test('throw on invalid object', ({ expect }) => {
        expect(() => {
            compose(null, { name: 'felix' });
        }).toThrowErrorMatchingInlineSnapshot(`
      [TypeError: Invalid compose {...} input type "object", value [object Object].

      Received as:

      {
        "name": "felix"
      }

      ]
    `);
    });

    test('throw on Symbol', ({ expect }) => {
        expect(() => {
            compose(null, Symbol.for('still not a string'));
        }).toThrowErrorMatchingInlineSnapshot(
            `[TypeError: Invalid compose {...} input type "symbol", value Symbol.]`);
    });

    test('throw on non-render object new Class', ({ expect }) => {
        expect(() => {
            compose(null, class MyClass { });
        }).toThrowErrorMatchingInlineSnapshot(`[TypeError: Class constructor MyClass cannot be invoked without 'new']`);
    });
});