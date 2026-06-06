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

    test('Channel-wrapped source (unwraps and applies transform to wrapped initial)', async ({ expect }) => {
        async function* gen() {
            yield 'duchess';
        }
        const wrapped = new Channel({ source: gen() }, 'felix');
        const c = new Channel({
            source: wrapped,
            as: name => name.toUpperCase()
        });
        expect(c.initial).toBe('FELIX'); // transform applied to wrapped initial
        const collected = [];
        for await(const v of c.source) collected.push(v);
        expect(collected).toEqual(['DUCHESS']);
    });

    test('throws when Channel-wrapped source combined with childNodes', ({ expect }) => {
        const wrapped = new Channel({ source: Promise.resolve('duchess') }, 'felix');
        const node = document.createTextNode('loading');
        expect(() => {
            new Channel({ source: wrapped }, node);
        }).toThrow(/cannot be combined with a Channel-wrapped source/);
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

    test('preserves ReadableStream when no transform', ({ expect }) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue('a');
                controller.enqueue('b');
                controller.close();
            }
        });
        const c = new Channel({ source: stream });
        // Source passes through unchanged — compose.js handles ReadableStream
        // natively (chunk-by-chunk accumulate).
        expect(c.source).toBe(stream);
    });

    test('pipes through TransformStream when transform provided', async ({ expect }) => {
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
        expect(c.source).toBeInstanceOf(ReadableStream);
        expect(c.source).not.toBe(stream); // a new piped stream

        const reader = c.source.getReader();
        const chunks = [];
        while(true) {
            const { value, done } = await reader.read();
            if(done) break;
            chunks.push(value);
        }
        expect(chunks).toEqual(['A', 'B']);
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

