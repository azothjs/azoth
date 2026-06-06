import { describe, test } from 'vitest';
import { Channel, channel } from './channel.js';

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
        const wrapped = Channel.from('felix', gen());
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
        const wrapped = Channel.from('felix', Promise.resolve('duchess'));
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

describe('Channel.from — factory bypass', () => {

    test('bypasses constructor, takes (initial, source) directly', ({ expect }) => {
        const source = Promise.resolve('felix');
        const c = Channel.from('initial value', source);
        expect(c.initial).toBe('initial value');
        // .source is set directly, not wrapped through makeAsyncStream
        expect(c.source).toBe(source);
    });

    test('factory result is still instanceof Channel', ({ expect }) => {
        const c = Channel.from('x', Promise.resolve('y'));
        expect(c).toBeInstanceOf(Channel);
    });

});

describe('channel() legacy function — delegates to Channel', () => {

    test('basic delegation returns Channel wrapping the source', async ({ expect }) => {
        const promise = Promise.resolve('felix');
        const c = channel(promise);
        expect(c).toBeInstanceOf(Channel);
        await expect(c.source).resolves.toBe('felix');
    });

    test('with transform', async ({ expect }) => {
        const promise = Promise.resolve('felix');
        const c = channel(promise, n => n.toUpperCase());
        expect(c).toBeInstanceOf(Channel);
        await expect(c.source).resolves.toBe('FELIX');
    });

    test('with { initial }', ({ expect }) => {
        const promise = Promise.resolve('duchess');
        const c = channel(promise, n => n.toUpperCase(), { initial: 'loading' });
        expect(c).toBeInstanceOf(Channel);
        expect(c.initial).toBe('loading');
    });

    test('legacy { start } as alias for initial', ({ expect }) => {
        const promise = Promise.resolve('felix');
        const c = channel(promise, { start: 'loading' });
        expect(c).toBeInstanceOf(Channel);
        expect(c.initial).toBe('loading');
    });

    test('legacy { init } applies transform to initial', ({ expect }) => {
        const promise = Promise.resolve('duchess');
        const c = channel(promise, n => n.toUpperCase(), { init: 'felix' });
        expect(c).toBeInstanceOf(Channel);
        expect(c.initial).toBe('FELIX'); // transform applied to init
    });

    test('legacy { map: true } wraps transform per-element', async ({ expect }) => {
        const arr = [{ n: 1 }, { n: 2 }, { n: 3 }];
        const promise = Promise.resolve(arr);
        const c = channel(promise, item => item.n, { map: true });
        expect(c).toBeInstanceOf(Channel);
        await expect(c.source).resolves.toEqual([1, 2, 3]);
    });

});
