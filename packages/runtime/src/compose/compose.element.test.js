import { describe, test, expect } from 'vitest';
import { compose, composeElement, createElement } from './compose.js';
import { $anchor, elementWithAnchor, elementWithText, elementWithTextAnchor, runCompose } from '../test-utils/elements.test.js';


describe('compose element', () => {

    test('instantiate with props', ({ expect }) => {
        function Component({ name }) {
            // <div>{name}</div>
            return runCompose(name, elementWithAnchor);
        }

        const { dom, anchor } = elementWithTextAnchor();

        composeElement(Component, anchor, { name: 'felix' });

        expect(dom).toMatchInlineSnapshot(`
          <div>
            Hello
            <div>
              felix
              <!--1-->
            </div>
            <!--1-->
          </div>
        `);
    });

    test('nested anchors', ({ expect }) => {
        // arrange

        // <!--0-->
        const anchor = $anchor();
        const { dom, anchor: parent } = elementWithAnchor();
        compose(anchor, parent);

        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
            <!--1-->
          </div>
        `);

        compose(elementWithText().dom, anchor);

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
        compose(anchor2, parent);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
            <!--1-->
          </div>
        `);

        compose(elementWithText('goodbye').dom, anchor2);
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
});


describe('create element', () => {

    test('instantiate with props', ({ expect }) => {
        function Component({ name }) {
            // <div>{name}</div>
            return runCompose(name, elementWithAnchor);
        }

        const dom = createElement(Component, { name: 'felix' });

        expect(dom).toMatchInlineSnapshot(`
          <div>
            felix
            <!--1-->
          </div>
        `);
    });

    test('nested anchors', ({ expect }) => {
        // arrange

        // <!--0-->
        const anchor = $anchor();
        const { dom, anchor: parent } = elementWithAnchor();
        compose(anchor, parent);

        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
            <!--1-->
          </div>
        `);

        compose(elementWithText().dom, anchor);

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
        compose(anchor2, parent);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
            <!--1-->
          </div>
        `);

        compose(elementWithText('goodbye').dom, anchor2);
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

    test('instantiate with props', ({ expect }) => {
        function Component({ name }) {
            // <div>{name}</div>
            return runCompose(name, elementWithAnchor);
        }

        const { dom, anchor } = elementWithTextAnchor();

        composeElement(Component, anchor, { name: 'felix' });

        expect(dom).toMatchInlineSnapshot(`
          <div>
            Hello
            <div>
              felix
              <!--1-->
            </div>
            <!--1-->
          </div>
        `);
    });
});


