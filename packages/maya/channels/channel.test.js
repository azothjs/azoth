import { describe, test } from 'vitest';
import { Channel } from './channel.js';

/**
 * Unit tests for the Channel class — construction logic only. These tests
 * verify the SHAPE of the resulting Channel instance, not the rendered DOM.
 *
 * For end-to-end JSX integration tests (`<Channel source={...}>`), see
 * packages/valhalla/channels.test.tsx.
 */

describe('Channel — construction', () => {

    test('promise source with no transform', async ({ expect }) => {
        const promise = Promise.resolve('felix');
        const c = new Channel({ source: promise });
        expect(c.initial).toBeUndefined();
        // Without a transform, source passes through unchanged
        expect(c.source).toBe(promise);
        await expect(c.source).resolves.toBe('felix');
    });

    test('promise source with transform', async ({ expect }) => {
        const promise = Promise.resolve('felix');
        const c = new Channel({
            source: promise,
            as: name => `Mr. ${name}`
        });
        expect(c.initial).toBeUndefined();
        await expect(c.source).resolves.toBe('Mr. felix');
    });

    test('initial via childNodes (no transform applied)', ({ expect }) => {
        const loadingNode = document.createTextNode('loading…');
        const promise = Promise.resolve('felix');
        const c = new Channel({
            source: promise,
            as: name => name.toUpperCase()
        }, loadingNode);
        // childNodes is the only initial — does NOT go through `as`
        expect(c.initial).toBe(loadingNode);
    });

    test('map wraps transform for array-shaped values', async ({ expect }) => {
        const promise = Promise.resolve([{ n: 1 }, { n: 2 }, { n: 3 }]);
        const c = new Channel({
            source: promise,
            as: item => item.n,
            map: true
        });
        await expect(c.source).resolves.toEqual([1, 2, 3]);
    });

    test('map without transform is a no-op (no wrapping)', async ({ expect }) => {
        const arr = [1, 2, 3];
        const promise = Promise.resolve(arr);
        const c = new Channel({ source: promise, map: true });
        await expect(c.source).resolves.toBe(arr);
    });

    test('async iterator source', async ({ expect }) => {
        async function* gen() {
            yield 'felix';
            yield 'duchess';
        }
        const c = new Channel({ source: gen() });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['felix', 'duchess']);
    });

    test('async iterator source with transform', async ({ expect }) => {
        async function* gen() {
            yield 'felix';
            yield 'duchess';
        }
        const c = new Channel({
            source: gen(),
            as: name => name.toUpperCase()
        });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['FELIX', 'DUCHESS']);
    });

    test('throws on unsupported source type', ({ expect }) => {
        expect(() => {
            new Channel({ source: 42 });
        }).toThrow(/unsupported source type/);
    });

    test('undefined source produces undefined .source (initial-only Channel via childNodes)', ({ expect }) => {
        const c = new Channel({}, 'hi');
        expect(c.initial).toBe('hi');
        expect(c.source).toBeUndefined();
    });

});

describe('Channel with ReadableStream source', () => {

    // Modern ReadableStream has [Symbol.asyncIterator], so Channel treats
    // it via the async-iterable path. Channel doesn't preserve the stream
    // identity — it wraps in an async generator so transform + error
    // routing work uniformly across all iterable-shaped sources.

    test('flows through async iteration', async ({ expect }) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue('a');
                controller.enqueue('b');
                controller.close();
            }
        });
        const c = new Channel({ source: stream });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['a', 'b']);
    });

    test('transform applied per chunk', async ({ expect }) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue('a');
                controller.enqueue('b');
                controller.close();
            }
        });
        const c = new Channel({
            source: stream,
            as: s => s.toUpperCase()
        });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['A', 'B']);
    });

    test('stream error caught by error transform', async ({ expect }) => {
        // Per WHATWG Streams spec, calling controller.error() in the same
        // tick as enqueue() resets the queue and discards pending chunks —
        // so we test the pure-error path. Chunks that have already been
        // *consumed* before the error fires still land (covered indirectly
        // by the integration tests that push and read across ticks).
        const stream = new ReadableStream({
            start(controller) {
                controller.error(new Error('stream broke'));
            }
        });
        const c = new Channel({
            source: stream,
            error: err => `[err: ${err.message}]`
        });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['[err: stream broke]']);
    });

    test('stream error without error transform propagates', async ({ expect }) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.error(new Error('stream broke'));
            }
        });
        const c = new Channel({ source: stream });
        await expect(async () => {
            for await(const _ of c.source) { /* drain */ }
        }).rejects.toThrow(/stream broke/);
    });

});

describe('Channel append prop (construction)', () => {

    test('append defaults to false when not provided', ({ expect }) => {
        const c = new Channel({ source: Promise.resolve('x') });
        expect(c.append).toBe(false);
    });

    test('append coerces presence-as-true (JSX attribute style)', ({ expect }) => {
        const c = new Channel({ source: Promise.resolve('x'), append: true });
        expect(c.append).toBe(true);
    });

    test('append is read-only after construction', ({ expect }) => {
        const c = new Channel({ source: Promise.resolve('x'), append: true });
        expect(() => { c.append = false; }).toThrow(TypeError);
        expect(c.append).toBe(true);
    });

});

describe('Channel with Observable source', () => {

    // A minimal observable shape per the TC39 proposal — subscribe takes
    // an observer with { next, error, complete } methods and returns a
    // subscription with .unsubscribe.
    function makeObservable(emissions) {
        return {
            subscribe(observer) {
                let cancelled = false;
                (async () => {
                    for(const value of emissions) {
                        if(cancelled) return;
                        observer.next(value);
                        // Yield to microtask queue between emissions
                        await Promise.resolve();
                    }
                    if(!cancelled) observer.complete();
                })();
                return { unsubscribe() { cancelled = true; } };
            }
        };
    }

    test('observable values flow through as async iteration', async ({ expect }) => {
        const obs = makeObservable(['felix', 'duchess', 'garfield']);
        const c = new Channel({ source: obs });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['felix', 'duchess', 'garfield']);
    });

    test('observable values flow through with transform', async ({ expect }) => {
        const obs = makeObservable(['felix', 'duchess']);
        const c = new Channel({
            source: obs,
            as: n => n.toUpperCase()
        });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['FELIX', 'DUCHESS']);
    });

    test('observable error propagates through async iteration', async ({ expect }) => {
        const obs = {
            subscribe(observer) {
                queueMicrotask(() => {
                    observer.next('felix');
                    observer.error(new Error('source broke'));
                });
                return { unsubscribe() {} };
            }
        };
        const c = new Channel({ source: obs });
        const collected = [];
        await expect(async () => {
            for await(const v of c.source) collected.push(v);
        }).rejects.toThrow(/source broke/);
        expect(collected).toEqual(['felix']);
    });

});

describe('Compose subtractions — primitive-as-component', () => {

    // These document the new throwing behavior. They live with the Channel
    // tests because Channel is the canonical surface they touch, but the
    // behavior comes from compose.js's create() function.

    test('string in component position throws', async ({ expect }) => {
        // Simulate: <Cat /> where Cat = "bill" — accidentally a string
        const { createComponent } = await import('../compose/compose.js');
        expect(() => createComponent('bill')).toThrow(/Cannot use string/);
    });

    test('number in component position throws', async ({ expect }) => {
        const { createComponent } = await import('../compose/compose.js');
        expect(() => createComponent(42)).toThrow(/Cannot use number/);
    });

    test('DOM Node still works as a component value (no skinning)', async ({ expect }) => {
        // Passing a Node as a "component" returns the Node. Props are
        // NOT overlaid via Object.assign (that path was removed).
        const { createComponent } = await import('../compose/compose.js');
        const node = document.createElement('div');
        node.textContent = 'original';
        const result = createComponent(node, { textContent: 'overlaid?' });
        expect(result).toBe(node);
        // Skinning is gone — textContent is NOT overwritten.
        expect(node.textContent).toBe('original');
    });

});

describe('Channel error transform', () => {

    test('Promise rejection with `error` prop yields error transform result', async ({ expect }) => {
        const promise = Promise.reject(new Error('boom'));
        const c = new Channel({
            source: promise,
            error: err => `oops: ${err.message}`
        });
        await expect(c.source).resolves.toBe('oops: boom');
    });

    test('Promise rejection without `error` prop propagates', async ({ expect }) => {
        const promise = Promise.reject(new Error('boom'));
        const c = new Channel({ source: promise });
        await expect(c.source).rejects.toThrow(/boom/);
    });

    test('async iterator throwing with `error` yields error transform then ends', async ({ expect }) => {
        async function* gen() {
            yield 'felix';
            throw new Error('source broke');
        }
        const c = new Channel({
            source: gen(),
            error: err => `[error: ${err.message}]`
        });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['felix', '[error: source broke]']);
    });

    test('async iterator throwing without `error` propagates', async ({ expect }) => {
        async function* gen() {
            yield 'felix';
            throw new Error('source broke');
        }
        const c = new Channel({ source: gen() });
        const collected = [];
        await expect(async () => {
            for await(const v of c.source) collected.push(v);
        }).rejects.toThrow(/source broke/);
        expect(collected).toEqual(['felix']);
    });

    test('observable error with `error` prop yields error result and completes', async ({ expect }) => {
        const obs = {
            subscribe(observer) {
                queueMicrotask(() => {
                    observer.next('felix');
                    observer.error(new Error('source broke'));
                });
                return { unsubscribe() {} };
            }
        };
        const c = new Channel({
            source: obs,
            error: err => `[error: ${err.message}]`
        });
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['felix', '[error: source broke]']);
    });

    test('Channel instance is read-only after construction', ({ expect }) => {
        const c = new Channel({ source: Promise.resolve('x') });
        // Attempting to write throws in strict mode (test files run as
        // modules → strict). The getters expose the private fields read-only.
        expect(() => { c.initial = 'something else'; }).toThrow(TypeError);
        expect(() => { c.source = 'something else'; }).toThrow(TypeError);
    });

    test('error transform output bypasses the `as` value transform', async ({ expect }) => {
        // The `as` transform shouldn't be applied to the error result —
        // the user's `error` prop is responsible for producing renderable
        // output directly.
        const promise = Promise.reject(new Error('boom'));
        const c = new Channel({
            source: promise,
            as: v => v.toUpperCase(),
            error: err => err.message  // returns "boom", not "BOOM"
        });
        await expect(c.source).resolves.toBe('boom');
    });

});

