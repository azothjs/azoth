import { describe, test, beforeEach } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { $div, elementWithText, elementWithAnchor } from 'test-utils/elements';
import { fixtureSetup } from 'test-utils/fixtures';
import { runCompose } from './compose.test.js';
import { Sync, composeComponent, createComponent } from './compose.js';

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
const CONSTRUCTORS = [Component, ClassComp, RenderObject, ArrowComp];

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
        expect(ClassComp.prototype.constructor).toBeDefined();
        expect(ArrowComp.prototype?.constructor).not.toBeDefined();
        expect(RenderObject.prototype?.constructor).not.toBeDefined();
    });

    describe.each(CONSTRUCTORS)('%o', Constructor => {
        const expected = `<div>felix<!--1--></div>`;
        test('prop-agation', ({ expect }) => {
            const dom = createComponent(Constructor, { name: 'felix' });
            expect(dom.outerHTML).toBe(expected);
        });
    });

    describe.each(ASYNC_CONSTRUCTORS)('%o', Constructor => {
        const expected = `<div>felix<!--1--></div><!--1-->`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const dom = createComponent(Constructor, { name: 'felix' });
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

    describe.each(CONSTRUCTORS.concat(ASYNC_CONSTRUCTORS))('promised %o', Constructor => {
        const expected = `<div>felix<!--1--></div><!--1-->`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const dom = createComponent(Promise.resolve(Constructor), { name: 'felix' });
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

    describe.each(CONSTRUCTORS.concat(ASYNC_CONSTRUCTORS))('promised %o', Constructor => {
        const expected = `<div>felix<!--1--></div><!--1-->`;
        test('prop-agation', async ({ expect, fixture, find }) => {
            const dom = createComponent(Promise.resolve(Constructor), { name: 'felix' });
            fixture.append(dom);
            await find('felix');
            expect(fixture.innerHTML).toBe(expected);
        });
    });

});

describe('prop-agation', () => {
    test('Node props', async ({ expect }) => {
        const div = $div();
        const dom = createComponent(div, { textContent: 'felix' });
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

        const dom = createComponent(Numbers(), { className: 'number' });
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
            createComponent(MyClass, { name: 'felix' });
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

describe('Sync wrap', () => {
    test('initial render', async ({ expect, fixture, find }) => {
        const syncWrapper = Sync.wrap('cat coming', ClassCompP);
        const dom = createComponent(syncWrapper, { name: 'felix' });
        expect(dom).toMatchInlineSnapshot(`
          <DocumentFragment>
            cat coming
            <!--1-->
          </DocumentFragment>
        `);

        fixture.append(dom);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"cat coming<!--1-->"`);

        await find('felix');
        expect(fixture.innerHTML).toBe(`<div>felix<!--1--></div><!--1-->`);
    });
});

