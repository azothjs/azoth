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
 * <Channel/> by itself returns a Channel instance, not a DOM node (this
 * is the same asymmetry as any class-shaped component in Azoth). In the
 * tests below we wrap in an outer element (e.g. <main>) so compose has
 * a place to render.
 *
 * Note on whitespace: multi-line JSX preserves whitespace between sibling
 * elements as text nodes. To get clean HTML snapshots, the JSX is kept
 * inline within these tests (single-line). For multi-line authoring
 * patterns see workflow.md.
 */

import { describe, test } from 'vitest';
import { Channel } from '@azothjs/maya/channels';

function fixture(): HTMLElement {
    document.body.innerHTML = '';
    return document.body;
}

// Flush microtasks/macrotasks. Channels resolve via the async iteration /
// promise chain; flushing the task queue lets the pipeline land its values.
async function flush(times = 2): Promise<void> {
    for(let i = 0; i < times; i++) {
        await new Promise(r => setTimeout(r, 0));
    }
}

describe('Channel with Promise source', () => {

    test('promise resolves to DOM', async ({ expect }) => {
        const promise = Promise.resolve(<p>felix</p>);
        const root = fixture();
        root.append(<main><Channel source={promise} /></main>);

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><!--0--></main>"`
        );

        await flush();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>felix</p><!--1--></main>"`
        );
    });

    test('promise with transform via `as`', async ({ expect }) => {
        const promise = Promise.resolve({ name: 'felix' });
        const root = fixture();
        root.append(<main><Channel source={promise} as={({ name }) => <p>{name}</p>} /></main>);

        await flush();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>felix<!--1--></p><!--1--></main>"`
        );
    });

    test('children as initial loading state', async ({ expect }) => {
        const promise = Promise.resolve(<p>felix</p>);
        const root = fixture();
        root.append(<main><Channel source={promise}><p>loading…</p></Channel></main>);

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>loading…</p><!--1--></main>"`
        );

        await flush();

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

        await flush(3);

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

        await flush(3);

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>duchess<!--1--></p><!--1--></main>"`
        );
    });

    test('async iterator with children as initial', async ({ expect }) => {
        async function* gen() {
            await new Promise(r => setTimeout(r, 10));
            yield <p>felix</p>;
        }
        const root = fixture();
        root.append(<main><Channel source={gen()}><p>loading…</p></Channel></main>);

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>loading…</p><!--1--></main>"`
        );

        await flush(5);

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>felix</p><!--1--></main>"`
        );
    });

});

describe('Channel with map prop (array iteration)', () => {

    test('promise of array with as + map renders each element', async ({ expect }) => {
        const promise = Promise.resolve([{ name: 'felix' }, { name: 'duchess' }]);
        const root = fixture();
        root.append(<main><Channel source={promise} as={({ name }) => <p>{name}</p>} map /></main>);

        await flush();

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

        await flush(3);

        // Last yield replaces previous
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>duchess<!--1--></p><p>garfield<!--1--></p><!--2--></main>"`
        );
    });

});

describe('Channel — equivalent class and instance forms', () => {

    test('<Channel> JSX produces a Channel instance', async ({ expect }) => {
        // JSX form: <Channel source={...}/> inside outer JSX
        const promise = Promise.resolve(<p>same</p>);
        const root = fixture();
        root.append(<main><Channel source={promise} /></main>);

        await flush();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>same</p><!--1--></main>"`
        );
    });

    test('pre-constructed Channel instance interpolated as child', async ({ expect }) => {
        // Direct class form: build a Channel instance, interpolate in {…}
        const ch = new Channel({ source: Promise.resolve(<p>same</p>) });
        const root = fixture();
        root.append(<main>{ch}</main>);

        await flush();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>same</p><!--1--></main>"`
        );
    });

});
