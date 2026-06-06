/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * CHANNEL TESTS
 *
 * Integration tests for <Channel> JSX usage. These show how to wire an
 * async data source (promise / async iterator / etc.) into a DOM slot
 * and what HTML the result produces.
 *
 * For unit tests of the Channel class construction logic (instance shape,
 * not DOM rendering), see packages/maya/channels/channel.test.js.
 *
 * Note on usage: <Channel> is meant to live INSIDE other JSX — its parent
 * provides the anchor that the Channel composes into. A top-level
 * <Channel/> by itself returns a Channel instance, not a DOM node (the
 * same asymmetry as any class-shaped component in Azoth). The tests below
 * wrap in an outer element (e.g. <main>) so compose has a place to render.
 *
 * Note on whitespace: multi-line JSX preserves whitespace between sibling
 * elements as text nodes. To get clean HTML snapshots, the JSX is kept
 * inline within these tests (single-line).
 *
 * Note on timing: for promise tests we use Promise.withResolvers() so the
 * test controls exactly when the source resolves — no guessing at flush
 * counts. For async-iterator tests with setTimeout-based delays we use
 * vitest fake timers (vi.useFakeTimers + vi.runAllTimersAsync) to advance
 * the pipeline deterministically without real wall-clock waits.
 */

import { describe, test, beforeEach, afterEach, vi } from 'vitest';
import { Channel } from '@azothjs/maya/channels';

function fixture(): HTMLElement {
    document.body.innerHTML = '';
    return document.body;
}

// Microtask flush — lets the .then chain land after a resolved promise.
// Sufficient for single-step promise pipelines.
async function microtasks(): Promise<void> {
    await null;
    await null;
}

// Macrotask boundary — drains the entire microtask queue. Use for async
// iterators where multiple yields need to propagate through the pipeline.
async function macrotask(): Promise<void> {
    await new Promise(r => setTimeout(r, 0));
}

describe('Channel with Promise source', () => {

    test('promise resolves to DOM', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers<JSX.Element>();
        const root = fixture();
        root.append(<main><Channel source={promise} /></main>);

        // Before resolve — just the anchor
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><!--0--></main>"`
        );

        resolve(<p>felix</p>);
        await microtasks();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>felix</p><!--1--></main>"`
        );
    });

    test('promise with transform via `as`', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers<{ name: string }>();
        const root = fixture();
        root.append(<main><Channel source={promise} as={({ name }) => <p>{name}</p>} /></main>);

        resolve({ name: 'felix' });
        await microtasks();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>felix<!--1--></p><!--1--></main>"`
        );
    });

    test('children as initial loading state', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers<JSX.Element>();
        const root = fixture();
        root.append(<main><Channel source={promise}><p>loading…</p></Channel></main>);

        // Before resolve — children render
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>loading…</p><!--1--></main>"`
        );

        resolve(<p>felix</p>);
        await microtasks();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>felix</p><!--1--></main>"`
        );
    });

});

describe('Channel with async iterator source', () => {

    test('async generator yields DOM values', async ({ expect }) => {
        async function* gen() {
            yield <p>felix</p>;
            yield <p>duchess</p>;
        }
        const root = fixture();
        root.append(<main><Channel source={gen()} /></main>);

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><!--0--></main>"`
        );

        // Async iteration: multiple yields propagate over several microtask
        // hops. A macrotask boundary drains the whole pipeline cleanly.
        await macrotask();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>duchess</p><!--1--></main>"`
        );
    });

    test('async iterator with transform', async ({ expect }) => {
        async function* gen() {
            yield { name: 'felix' };
            yield { name: 'duchess' };
        }
        const root = fixture();
        root.append(<main><Channel source={gen()} as={({ name }) => <p>{name}</p>} /></main>);

        await macrotask();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>duchess<!--1--></p><!--1--></main>"`
        );
    });

    describe('with timed delays', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        test('children as initial; delayed yield replaces', async ({ expect }) => {
            async function* gen() {
                await new Promise(r => setTimeout(r, 1000));
                yield <p>felix</p>;
            }
            const root = fixture();
            root.append(<main><Channel source={gen()}><p>loading…</p></Channel></main>);

            // Before time advances — children show
            expect(root.innerHTML).toMatchInlineSnapshot(
                /* HTML */ `"<main><p>loading…</p><!--1--></main>"`
            );

            await vi.runAllTimersAsync();

            expect(root.innerHTML).toMatchInlineSnapshot(
                /* HTML */ `"<main><p>felix</p><!--1--></main>"`
            );
        });
    });

});

describe('Channel with map prop (array iteration)', () => {

    test('promise of array with as + map renders each element', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers<{ name: string }[]>();
        const root = fixture();
        root.append(<main><Channel source={promise} as={({ name }) => <p>{name}</p>} map /></main>);

        resolve([{ name: 'felix' }, { name: 'duchess' }]);
        await microtasks();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>felix<!--1--></p><p>duchess<!--1--></p><!--2--></main>"`
        );
    });

    test('async iterator of arrays with map', async ({ expect }) => {
        async function* gen() {
            yield [{ name: 'felix' }];
            yield [{ name: 'duchess' }, { name: 'garfield' }];
        }
        const root = fixture();
        root.append(<main><Channel source={gen()} as={({ name }) => <p>{name}</p>} map /></main>);

        await macrotask();

        // Last yield replaces previous
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>duchess<!--1--></p><p>garfield<!--1--></p><!--2--></main>"`
        );
    });

});

describe('Channel — equivalent class and instance forms', () => {

    test('<Channel> JSX produces a Channel instance', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers<JSX.Element>();
        const root = fixture();
        root.append(<main><Channel source={promise} /></main>);

        resolve(<p>same</p>);
        await microtasks();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>same</p><!--1--></main>"`
        );
    });

    test('pre-constructed Channel instance interpolated as child', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers<JSX.Element>();
        const ch = new Channel({ source: promise });
        const root = fixture();
        root.append(<main>{ch}</main>);

        resolve(<p>same</p>);
        await microtasks();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>same</p><!--1--></main>"`
        );
    });

});
