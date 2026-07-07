import { describe, test, beforeEach } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { $element, elementWithText, elementWithAnchor } from 'test-utils/elements';
import { fixtureSetup } from 'test-utils/fixtures';
import { runCompose } from './compose.test.js';
import { composeComponent, createComponent } from './compose.js';

beforeEach(fixtureSetup);

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

const RenderObject = {
    initialize({ name }) { this.name = name; },
    render() {
        return runCompose(this.name, elementWithAnchor);
    }
};
const CONSTRUCTORS = [Component, ClassComp, ArrowComp, RenderObject];

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
    initialize({ name }) { this.name = name; },
    async render() {
        return runCompose(this.name, elementWithAnchor);
    }
};
const ArrowCompP = async ({ name }) => runCompose(name, elementWithAnchor);
const ASYNC_CONSTRUCTORS = [ComponentP, ClassCompP, RenderObjectP, ArrowCompP];

describe('create element', () => {

    test('pin .prototype.constructor for function, arrow fn, class', ({ expect }) => {
        expect(Component.prototype.constructor).toBeDefined();
        expect(ClassComp.prototype.constructor).toBeDefined();
        expect(ArrowComp.prototype?.constructor).not.toBeDefined();
        expect(RenderObject.prototype?.constructor).not.toBeDefined();
    });

    const expected = `<div>felix<!--az:1--></div>`;
    const create = Constructor => createComponent(Constructor, { name: 'felix' });
    test('constructed values', async ({ expect }) => {
        expect(create(Component).outerHTML).toBe(expected);
        expect(create(ArrowComp).outerHTML).toBe(expected);
        // create() preserves the instance (construct phase); render() drives to DOM.
        expect(create(RenderObject).render().outerHTML).toBe(expected);
        expect(create(ClassComp).render().outerHTML).toBe(expected);

        expect((await create(ComponentP)).outerHTML).toBe(expected);
        expect((await create(RenderObjectP).render()).outerHTML).toBe(expected);
        expect((await create(ArrowCompP)).outerHTML).toBe(expected);
        expect((await create(ClassCompP).render())().outerHTML).toBe(expected);
    });

});

describe('prop-agation', () => {

    test('async iterator in component position throws (values belong in slots)', async ({ expect }) => {
        // Component position eats clean; interpolators are the gourmands.
        // An async iterator is a VALUE — interpolate it: {iter}.
        async function* Numbers() {
            yield $element('one');
        }
        expect(() => createComponent(Numbers()))
            .toThrow(/Invalid compose/);
    });

    test('async FUNCTION component works — async arrives as return value', async ({ expect, fixture, find }) => {
        // The lazy-component idiom: the function is synchronous to create;
        // its Promise return flows through compose's existing async path.
        async function Lazy({ name }) {
            const El = await Promise.resolve($element);
            return El(name);
        }
        const { dom, anchor } = elementWithAnchor();
        composeComponent(anchor, [Lazy, { name: 'lazy-cat' }]);
        fixture.append(dom);
        await find('lazy-cat');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div><div>lazy-cat</div><!--az:1--></div>"`
        );
    });

    test('Non-render class is error', async ({ expect }) => {
        class MyClass { }
        expect(() => {
            composeComponent(null, [MyClass]);
        }).toThrowErrorMatchingInlineSnapshot(
            `
          [TypeError: Invalid compose {...} input type "object", value [object Object].

          Did you forget to return a value from "MyClass"if a function, or a "render" method if a class?

          Received as:

          {}

          ]
        `);
    });
});

describe('compose element', () => {

    describe.each(CONSTRUCTORS.concat(ASYNC_CONSTRUCTORS))('%o', Constructor => {
        const expected = `<div><div>felix<!--az:1--></div><!--az:1--></div>`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const { dom, anchor } = elementWithAnchor();
            composeComponent(anchor, [Component, { name: 'felix' }]);
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

    test('Promise in component position throws — lazy components are async functions', ({ expect }) => {
        const { anchor } = elementWithAnchor();
        expect(() => {
            composeComponent(anchor, [Promise.resolve(Component), { name: 'felix' }]);
        }).toThrow(/Invalid compose/);
    });

    test('function returning a Promise of an array still composes', async ({ expect, fixture, find }) => {
        // The capability the removed Promise-in-component-position used to
        // carry, recovered as a function: async arrives as a return value.
        function ArrayList() {
            return Promise.resolve([
                elementWithText('one').dom,
                elementWithText('two').dom,
                elementWithText('three').dom,
            ]);
        }
        const { dom, anchor } = elementWithAnchor();
        composeComponent(anchor, [ArrayList]);
        fixture.append(dom);
        await find('one', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div><div>one</div><div>two</div><div>three</div><!--az:3--></div>"`
        );
    });

});

