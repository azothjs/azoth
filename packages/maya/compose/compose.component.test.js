import { describe, test, beforeEach } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { $element, elementWithText, elementWithAnchor } from 'test-utils/elements';
import { fixtureSetup } from 'test-utils/fixtures';
import { runCompose } from './compose.test.js';
import { Channel, composeComponent, createComponent } from './compose.js';

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
    render({ name }) {
        return runCompose(name, elementWithAnchor);
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
    async render({ name }) {
        return runCompose(name, elementWithAnchor);
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

    const expected = `<div>felix<!--1--></div>`;
    const create = Constructor => createComponent(Constructor, { name: 'felix' });
    test('constructed values', async ({ expect }) => {
        expect(create(Component).outerHTML).toBe(expected);
        expect(create(ArrowComp).outerHTML).toBe(expected);
        expect(create(RenderObject).outerHTML).toBe(expected);
        expect(create(ClassComp).render().outerHTML).toBe(expected);

        expect((await create(ComponentP)).outerHTML).toBe(expected);
        expect((await create(RenderObject)).outerHTML).toBe(expected);
        expect((await create(ArrowCompP)).outerHTML).toBe(expected);
        expect((await create(ClassCompP).render())().outerHTML).toBe(expected);
    });

});

describe('prop-agation', () => {
    // Removed: 'Node props' and 'Node from async iterator with props' tested
    // the DOM-overlay (skinning) behavior — passing a pre-built Node as a
    // "component" and having props overlaid via Object.assign. That path
    // was removed: component invocation means "construct"; modifying an
    // existing node is a separate concern. If skinning becomes a real
    // need, it'll get its own primitive.
    test.skip.todo('skinning replacement primitive (if needed)');

    test('skinning skipped — see todo above', async ({ expect, fixture, find }) => {
        let resolve = null;
        const doAsync = async (value) => {
            const { promise, resolve: res } = Promise.withResolvers();
            resolve = () => res(value);
            return promise;
        };

        async function* Numbers() {
            yield doAsync($element('one'));
            yield doAsync($element('two'));
            yield doAsync($element('three'));
        }

        // Without prop overlay: nodes pass through as-is
        const dom = createComponent(Numbers());
        fixture.append(dom);

        resolve();
        await find('one');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>one</div><!--1-->"`
        );

        resolve();
        await find('two');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>two</div><!--1-->"`
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
        const expected = `<div><div>felix<!--1--></div><!--1--></div>`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const { dom, anchor } = elementWithAnchor();
            composeComponent(anchor, [Component, { name: 'felix' }]);
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

    describe.each(CONSTRUCTORS.concat(ASYNC_CONSTRUCTORS))('Promised %o', Constructor => {
        const expected = `<div><div>felix<!--1--></div><!--1--></div>`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const { dom, anchor } = elementWithAnchor();
            composeComponent(anchor, [Promise.resolve(Component), { name: 'felix' }]);
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

    function ArrayList() {
        return Promise.resolve([
            elementWithText('one').dom,
            elementWithText('two').dom,
            elementWithText('three').dom,
        ]);
    }

    test('Promised array component', async ({ expect, fixture, find }) => {
        const { dom, anchor } = elementWithAnchor();
        composeComponent(anchor, [Promise.resolve(ArrayList)]);
        fixture.append(dom);
        await find('one', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div><div>one</div><div>two</div><div>three</div><!--3--></div>"`
        );
    });

});

describe('Channel from', () => {
    test('basic render', async ({ expect, fixture, find }) => {
        const syncWrapper = new Channel({ source: Promise.resolve('async cat') }, 'sync cat');
        const dom = createComponent(syncWrapper);
        expect(dom).toMatchInlineSnapshot(`
          <DocumentFragment>
            sync cat
            <!--1-->
          </DocumentFragment>
        `);

        fixture.append(dom);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"sync cat<!--1-->"`);

        await find('async cat');
        expect(fixture.innerHTML).toBe(`async cat<!--1-->`);
    });

    class Loading {
        constructor({ name }) {
            this.name = name;
        }
        render() {
            return `Loading ${this.name}`;
        }
    }

    // TODO: this test exercises `Channel({source: Promise.resolve(SomeClass)}, ...)`
    // — a class-in-source-promise pattern where the class was instantiated
    // with outer props when the promise resolved. After the compose
    // subtractions, the Channel branch routes through compose() (value
    // position), which doesn't instantiate classes (classes need `new`).
    // The pattern is uncommon in practice — typically promises resolve to
    // data, not constructors. If we re-add support, it's via making
    // compose() handle the function-vs-class dispatch the way create() does.
    test.skip('creates', async ({ expect, fixture, find }) => {
        // Channel's initial used to be a class that got instantiated with
        // outer props on consumption. After the compose subtractions, the
        // Channel branch routes through compose() (value position), which
        // doesn't instantiate classes. Instead, the caller instantiates
        // the initial themselves.
        const loadingInstance = new Loading({ name: 'felix' });
        const syncWrapper = new Channel({ source: Promise.resolve(ClassComp) }, loadingInstance);
        const dom = createComponent(syncWrapper, { name: 'felix' });
        expect(dom).toMatchInlineSnapshot(`
          <DocumentFragment>
            Loading felix
            <!--1-->
          </DocumentFragment>
        `);

        fixture.append(dom);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"Loading felix<!--1-->"`
        );

        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>felix<!--1--></div><!--1-->"`
        );
    });
});

