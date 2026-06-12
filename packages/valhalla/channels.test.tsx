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

describe('Channel with ReadableStream source', () => {

    // Channel treats ReadableStream as an async iterable (modern streams
    // have [Symbol.asyncIterator]). Default is REPLACE — each chunk
    // replaces the previous. Add `append` to accumulate. (Raw streams in
    // a slot — without Channel — still accumulate via compose's
    // ReadableStream special case.)

    test('default (replace): each chunk replaces — only the last is visible', async ({ expect }) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue('felix');
                controller.enqueue(' and ');
                controller.enqueue('duchess');
                controller.close();
            }
        });
        const root = fixture();
        root.append(<main><Channel source={stream} /></main>);

        await macrotask();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main>duchess<!--1--></main>"`
        );
    });

    test('append: chunks accumulate after the first replaces any initial', async ({ expect }) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue('felix');
                controller.enqueue(' and ');
                controller.enqueue('duchess');
                controller.close();
            }
        });
        const root = fixture();
        root.append(<main><Channel source={stream} append /></main>);

        await macrotask();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main>felix and duchess<!--3--></main>"`
        );
    });

    test('append with transform: per-chunk transform applied, chunks accumulate', async ({ expect }) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue('felix');
                controller.enqueue('duchess');
                controller.close();
            }
        });
        const root = fixture();
        root.append(<main><Channel source={stream} as={s => s.toUpperCase() + ' '} append /></main>);

        await macrotask();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main>FELIX DUCHESS <!--2--></main>"`
        );
    });

});

describe('Channel with Observable source', () => {

    // Minimal observable per the TC39 proposal — subscribe takes
    // { next, error, complete } and returns { unsubscribe }.
    function makeObservable<T>(values: T[]) {
        return {
            subscribe(observer: { next(v: T): void; complete(): void }) {
                let cancelled = false;
                (async () => {
                    for(const v of values) {
                        if(cancelled) return;
                        observer.next(v);
                        await Promise.resolve();
                    }
                    if(!cancelled) observer.complete();
                })();
                return { unsubscribe() { cancelled = true; } };
            }
        };
    }

    test('observable values render through Channel', async ({ expect }) => {
        const obs = makeObservable([<p>felix</p>, <p>duchess</p>]);
        const root = fixture();
        root.append(<main><Channel source={obs} /></main>);

        await macrotask();

        // Like async iterator: last value replaces
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>duchess</p><!--1--></main>"`
        );
    });

    test('observable with transform', async ({ expect }) => {
        const obs = makeObservable([{ name: 'felix' }, { name: 'duchess' }]);
        const root = fixture();
        root.append(<main><Channel source={obs} as={({ name }) => <p>{name}</p>} /></main>);

        await macrotask();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>duchess<!--1--></p><!--1--></main>"`
        );
    });

    test('observable in a child slot (no Channel wrap) — compose handles directly', async ({ expect }) => {
        const obs = makeObservable([<p>direct</p>]);
        const root = fixture();
        // Cast: compose accepts observable shapes in child slots at runtime
        // but DOMChild doesn't model that yet — see "typing review" in TODO.md.
        root.append(<main>{obs as unknown as JSX.Element}</main>);

        await macrotask();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>direct</p><!--1--></main>"`
        );
    });

});

describe('Channel with error prop', () => {

    test('promise rejection rendered via error transform', async ({ expect }) => {
        const { promise, reject } = Promise.withResolvers<JSX.Element>();
        const root = fixture();
        root.append(<main><Channel source={promise} error={(err: Error) => <p class="err">{err.message}</p>} /></main>);

        reject(new Error('fetch failed'));
        await microtasks();

        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p class="err">fetch failed<!--1--></p><!--1--></main>"`
        );
    });

    test('async iterator error replaces with error transform output', async ({ expect }) => {
        async function* gen() {
            yield <p>felix</p>;
            throw new Error('source broke');
        }
        const root = fixture();
        root.append(<main><Channel source={gen()} error={(err: Error) => <p class="err">{err.message}</p>} /></main>);

        await macrotask();

        // After the error, the error transform's output is the final value
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p class="err">source broke<!--1--></p><!--1--></main>"`
        );
    });

});

describe('Channel with EventTarget source', () => {

    test('events from a target render via Channel.as', async ({ expect }) => {
        const target = new EventTarget();
        const root = fixture();
        root.append(<main><Channel source={target} eventType="ping" as={(e: CustomEvent) => <p>{String(e.detail)}</p>}><p>waiting</p></Channel></main>);

        // Initial render: childNodes are shown before any event
        await macrotask();
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>waiting</p><!--1--></main>"`
        );

        target.dispatchEvent(new CustomEvent('ping', { detail: 'a' }));
        await macrotask();
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>a<!--1--></p><!--1--></main>"`
        );

        target.dispatchEvent(new CustomEvent('ping', { detail: 'b' }));
        await macrotask();
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>b<!--1--></p><!--1--></main>"`
        );
    });

    test('append: events accumulate after replacing initial', async ({ expect }) => {
        const target = new EventTarget();
        const root = fixture();
        root.append(<main><Channel source={target} eventType="msg" as={(e: CustomEvent) => <p>{String(e.detail)}</p>} append><p>connecting</p></Channel></main>);

        await macrotask();
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>connecting</p><!--1--></main>"`
        );

        target.dispatchEvent(new CustomEvent('msg', { detail: 'one' }));
        await macrotask();
        // First event replaces the initial.
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>one<!--1--></p><!--1--></main>"`
        );

        target.dispatchEvent(new CustomEvent('msg', { detail: 'two' }));
        await macrotask();
        // Subsequent events accumulate.
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>one<!--1--></p><p>two<!--1--></p><!--2--></main>"`
        );

        target.dispatchEvent(new CustomEvent('msg', { detail: 'three' }));
        await macrotask();
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><p>one<!--1--></p><p>two<!--1--></p><p>three<!--1--></p><!--3--></main>"`
        );
    });

    test('DOM element as EventTarget — click counter', async ({ expect }) => {
        const button = document.createElement('button');
        button.textContent = 'click me';
        let count = 0;

        const root = fixture();
        root.append(<main>{button}<Channel source={button} eventType="click" as={() => <span>clicks: {++count}</span>}><span>clicks: 0</span></Channel></main>);

        await macrotask();
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><button>click me</button><!--1--><span>clicks: 0</span><!--1--></main>"`
        );

        button.click();
        await macrotask();
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><button>click me</button><!--1--><span>clicks: 1<!--1--></span><!--1--></main>"`
        );

        button.click();
        button.click();
        await macrotask();
        expect(root.innerHTML).toMatchInlineSnapshot(
            /* HTML */ `"<main><button>click me</button><!--1--><span>clicks: 3<!--1--></span><!--1--></main>"`
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
