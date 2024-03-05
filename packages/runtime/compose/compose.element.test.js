import { describe, test, expect } from 'vitest';
import { compose, composeElement, createElement } from './compose.js';
import { $anchor, $div, elementWithAnchor, elementWithText, elementWithTextAnchor } from 'test-utils/elements';
import { runCompose } from './compose.test.js';
import { fixtureSetup } from './compose.async.test.js';
import { beforeEach } from 'vitest';

// <div>{name}</div>
function Component({ name }) {
    return runCompose(name, elementWithAnchor);
}
class ClassComp {
    constructor({ name }) {
        this.name = name;
    }
    render() {
        return runCompose(this.name, elementWithAnchor);
    }
}
const ArrowComp = ({ name }) => runCompose(name, elementWithAnchor);
class ClassCompRender {
    render({ name }) {
        return runCompose(name, elementWithAnchor);
    }
}
const RenderObject = {
    render({ name }) {
        return runCompose(name, elementWithAnchor);
    }
};
const CONSTRUCTORS = [Component, ClassComp, RenderObject, ClassCompRender, ArrowComp];

function ComponentP({ name }) {
    return Promise.resolve(runCompose(name, elementWithAnchor));
}
class ClassCompP {
    constructor({ name }) {
        this.name = name;
    }
    async render() {
        return () => runCompose(this.name, elementWithAnchor);
    }
}
const RenderObjectP = {
    async render({ name }) {
        return runCompose(name, elementWithAnchor);
    }
};
class ClassCompRenderP {
    async render({ name }) {
        return () => runCompose(name, elementWithAnchor);
    }
}
const ArrowCompP = async ({ name }) => runCompose(name, elementWithAnchor);
const ASYNC_CONSTRUCTORS = [ComponentP, ClassCompP, RenderObjectP, ClassCompRenderP, ArrowCompP];

beforeEach(fixtureSetup);

describe('create element', () => {

    test('pin .prototype.constructor for function, arrow fn, class', ({ expect }) => {
        expect(Component.prototype.constructor).toBeDefined();
        expect(ClassComp.prototype.constructor).toBeDefined();
        expect(ClassComp.prototype.constructor).toBeDefined();
        expect(ArrowComp.prototype?.constructor).not.toBeDefined();
        expect(RenderObject.prototype?.constructor).not.toBeDefined();
    });

    describe.each(CONSTRUCTORS)('%o', Constructor => {
        const expected = `<div>felix<!--1--></div>`;
        test('prop-agation', ({ expect }) => {
            const dom = createElement(Constructor, { name: 'felix' });
            expect(dom.outerHTML).toBe(expected);
        });
    });

    describe.each(ASYNC_CONSTRUCTORS)('%o', Constructor => {
        const expected = `<div>felix<!--1--></div><!--1-->`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const dom = createElement(Constructor, { name: 'felix' });
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

    describe.each(CONSTRUCTORS.concat(ASYNC_CONSTRUCTORS))('promised %o', Constructor => {
        const expected = `<div>felix<!--1--></div><!--1-->`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const dom = createElement(Promise.resolve(Constructor), { name: 'felix' });
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

    describe.each(CONSTRUCTORS.concat(ASYNC_CONSTRUCTORS))('promised %o', Constructor => {
        const expected = `<div>felix<!--1--></div><!--1-->`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const dom = createElement(Promise.resolve(Constructor), { name: 'felix' });
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

});

describe('prop-agation', () => {
    test('Node props', async ({ expect }) => {
        const div = $div();
        const dom = createElement(div, { textContent: 'felix' });
        expect(dom).toMatchInlineSnapshot(`
          <div>
            felix
          </div>
        `);

    });

    test('Node from async iterator with props', async ({ expect, fixture, find }) => {
        let resolve = null;
        const doAsync = async (value) => {
            const { promise, resolve: res } = Promise.withResolvers();
            resolve = () => res(value);
            return promise;
        };

        async function* Numbers() {
            yield doAsync($div('one'));
            yield doAsync($div('two'));
            yield doAsync($div('three'));
        }

        const dom = createElement(Numbers(), { className: 'number' });
        fixture.append(dom);

        resolve();
        await find('one');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div class="number">one</div><!--1-->"`
        );

        resolve();
        await find('two');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div class="number">two</div><!--1-->"`
        );
    });

    test('Non-render class is error', async ({ expect }) => {
        class MyClass { }
        expect(() => {
            createElement(MyClass, { name: 'felix' });
        }).toThrowErrorMatchingInlineSnapshot(
            `
          [TypeError: Invalid compose {...} input type "object", value [object Object].

          Received as:

          {}

          ]
        `);
    });
});

describe('compose element', () => {

    describe.each(CONSTRUCTORS.concat(ASYNC_CONSTRUCTORS))('%o', Constructor => {
        const expected = `<div><div>felix<!--1--></div><!--1--></div>`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const { dom, anchor } = elementWithAnchor();
            composeElement(anchor, Component, { name: 'felix' });
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

    describe.each(CONSTRUCTORS.concat(ASYNC_CONSTRUCTORS))('Promised %o', Constructor => {
        const expected = `<div><div>felix<!--1--></div><!--1--></div>`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const { dom, anchor } = elementWithAnchor();
            composeElement(anchor, Promise.resolve(Component), { name: 'felix' });
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

});


