import { describe, test, expect } from 'vitest';
import { compose, composeElement, createElement } from './compose.js';
import { $anchor, $div, elementWithAnchor, elementWithText, elementWithTextAnchor } from 'test-utils/elements';
import { runCompose } from './compose.test.js';

// <div>{name}</div>

function Component({ name }) {
    return runCompose(name, elementWithAnchor);
}

const ArrowComp = ({ name }) => runCompose(name, elementWithAnchor);

class ClassComp {
    constructor({ name }) {
        this.name = name;
    }
    render() {
        return runCompose(this.name, elementWithAnchor);
    }
}

// async render

function ComponentP({ name }) {
    return Promise.resolve(runCompose(name, elementWithAnchor));
}

const ArrowCompP = async ({ name }) => runCompose(name, elementWithAnchor);

class ClassCompP {
    constructor({ name }) {
        this.name = name;
    }
    async render() {
        return () => runCompose(this.name, elementWithAnchor);
    }
}

describe('create element', () => {

    test('pin JavaScript constructors: function, arrow fn, class', ({ expect }) => {
        expect(Component.prototype.constructor).toBeDefined();
        expect(ClassComp.prototype.constructor).toBeDefined();
        expect(ArrowComp.prototype?.constructor).not.toBeDefined();
    });

    test('functions with props', ({ expect }) => {
        const dom = createElement(Component, { name: 'felix' });
        const domClass = createElement(ClassComp, { name: 'felix' });
        const domArrow = createElement(ArrowComp, { name: 'felix' });

        const expected = `
          <div>
            felix
            <!--1-->
          </div>
        `;
        expect(dom).toMatchInlineSnapshot(expected);
        expect(domClass).toMatchInlineSnapshot(expected);
        expect(domArrow).toMatchInlineSnapshot(expected);
    });

    test('secondary instance', async ({ except }) => {
        const div = $div();
        const divClass = $div();
        const divArrow = $div();
        div.append(createElement(ComponentP, { name: 'felix' }));
        divClass.append(createElement(ClassCompP, { name: 'felix' }));
        divArrow.append(createElement(ArrowCompP, { name: 'felix' }));

        const expected = `
          <div>
            <div>
              felix
              <!--1-->
            </div>
            <!--1-->
          </div>
        `;

        await null;

        expect(div).toMatchInlineSnapshot(expected);
        expect(divClass).toMatchInlineSnapshot(expected);
        expect(divArrow).toMatchInlineSnapshot(expected);
    });

});

describe('compose element', () => {

    test('instantiate with props', ({ expect }) => {
        const { dom, anchor } = elementWithTextAnchor();
        const { dom: domClass, anchor: anchorClass } = elementWithTextAnchor();
        const { dom: domArrow, anchor: anchorArrow } = elementWithTextAnchor();
        composeElement(anchor, Component, { name: 'felix' });
        composeElement(anchorClass, ClassComp, { name: 'felix' });
        composeElement(anchorArrow, ArrowComp, { name: 'felix' });

        const expected = `
          <div>
            Hello
            <div>
              felix
              <!--1-->
            </div>
            <!--1-->
          </div>
        `;

        expect(dom).toMatchInlineSnapshot(expected);
        expect(domClass).toMatchInlineSnapshot(expected);
        expect(domArrow).toMatchInlineSnapshot(expected);
    });

    test('secondary instance', async ({ except }) => {
        const { dom, anchor } = elementWithAnchor();
        const { dom: domClass, anchor: anchorClass } = elementWithAnchor();
        const { dom: domArrow, anchor: anchorArrow } = elementWithAnchor();
        composeElement(anchor, ComponentP, { name: 'felix' });
        composeElement(anchorClass, ClassCompP, { name: 'felix' });
        composeElement(anchorArrow, ArrowCompP, { name: 'felix' });

        const expected = `
          <div>
            <div>
              felix
              <!--1-->
            </div>
            <!--1-->
            <!--1-->
          </div>
        `;

        await null;

        expect(dom).toMatchInlineSnapshot(expected);
        expect(domClass).toMatchInlineSnapshot(expected);
        expect(domArrow).toMatchInlineSnapshot(expected);
    });

    test('nested anchors', ({ expect }) => {
        // <!--0-->
        const anchor = $anchor();
        const { dom, anchor: parent } = elementWithAnchor();
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
});


