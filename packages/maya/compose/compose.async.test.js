import { beforeEach, describe, test } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { elementWithAnchor } from 'test-utils/elements';
import { fixtureSetup } from 'test-utils/fixtures';
import { runCompose } from './compose.test.js';
import { Channel } from '../channels/channel.js';

beforeEach(fixtureSetup);

describe('async values', () => {

    test('promise', async ({ expect, fixture, find }) => {
        const dom = runCompose(Promise.resolve('hi'), elementWithAnchor);
        fixture.append(dom);
        await find('hi');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            hi
            <!--az:1-->
          </div>
        `);
    });

    test('array of promises', async ({ expect, fixture, find }) => {
        const futureLetters = [
            Promise.resolve('a'),
            Promise.resolve('b'),
            Promise.resolve('c'),
        ];
        const dom = runCompose(futureLetters, elementWithAnchor);
        fixture.append(dom);
        await find('abc');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            a
            b
            c
            <!--az:3-->
          </div>
        `);
    });

    test('async iterator', async ({ expect, fixture, find }) => {
        let resolve = null;
        const doAsync = async (value) => {
            const { promise, resolve: res } = Promise.withResolvers();
            resolve = () => res(value);
            return promise;
        };

        async function* numbers() {
            yield doAsync('one');
            yield doAsync('two');
            yield doAsync('three');
        }

        fixture.append(runCompose(numbers(), elementWithAnchor));
        // initial render
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div><!--az:0--></div>"`
        );

        resolve();
        await find('one');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>one<!--az:1--></div>"`
        );

        resolve();
        await find('two');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>two<!--az:1--></div>"`
        );

        resolve();
        await find('three');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>three<!--az:1--></div>"`
        );

        resolve();
        await find('three');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>three<!--az:1--></div>"`
        );
    });

    test('generator function called', async ({ expect, fixture, find }) => {
        const { promise, resolve } = Promise.withResolvers();

        async function* generator() {
            yield promise;
        }

        const numbersDom = runCompose(generator, elementWithAnchor);
        fixture.append(numbersDom);
        resolve('yielded');
        await find('yielded');

        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>yielded<!--az:1--></div>"`
        );
    });

    test('sync render promise', async ({ expect, fixture, find }) => {
        const syncWrapper = new Channel({ source: Promise.resolve('hi') }, 'sync render');
        const dom = runCompose(syncWrapper, elementWithAnchor);
        fixture.append(dom);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>sync render<!--az:1--></div>"`);
        await find('hi');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>hi<!--az:1--></div>"`);
    });

    test('sync render async iter', async ({ expect, fixture, find }) => {
        let resolve = null;
        const doAsync = async (value) => {
            const { promise, resolve: res } = Promise.withResolvers();
            resolve = () => res(value);
            return promise;
        };

        async function* numbers() {
            yield doAsync('one');
            yield doAsync('two');
            yield doAsync('three');
        }

        const syncWrapper = new Channel({ source: numbers() }, 'here come async numbers!');
        fixture.append(runCompose(syncWrapper, elementWithAnchor));
        // initial render
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>here come async numbers!<!--az:1--></div>"`
        );

        resolve();
        await find('one');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>one<!--az:1--></div>"`
        );
    });

    test('observable (direct subscribe, each next replaces)', ({ expect, fixture }) => {
        // Minimal TC39 Observable shape. compose subscribes directly and
        // each `next` flows through compose like any other value.
        let emit;
        const observable = {
            subscribe(observer) {
                emit = (v) => observer.next(v);
                return { unsubscribe() { } };
            }
        };

        fixture.append(runCompose(observable, elementWithAnchor));
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div><!--az:0--></div>"`);

        emit('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>felix<!--az:1--></div>"`);

        emit('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>duchess<!--az:1--></div>"`);
    });

    test('ReadableStream replaces per chunk (one rule for every async sequence)', async ({ expect, fixture, find }) => {
        // A stream is just an async iterable to compose — same replace
        // semantics as an async generator. Accumulation is opt-in upstream:
        // Channel/Input `append` (see the Channel append describe below).
        let push, close;
        const stream = new ReadableStream({
            start(controller) {
                push = (v) => controller.enqueue(v);
                close = () => controller.close();
            }
        });

        fixture.append(runCompose(stream, elementWithAnchor));
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div><!--az:0--></div>"`);

        push('a');
        await find('a');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>a<!--az:1--></div>"`);

        push('b');
        await find('b');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>b<!--az:1--></div>"`);

        close();
    });
});

describe('Channel append: first source value replaces initial, subsequent accumulate', () => {

    test('async iterator source', async ({ expect, fixture, find }) => {
        let resolve = null;
        const doAsync = async (value) => {
            const { promise, resolve: res } = Promise.withResolvers();
            resolve = () => res(value);
            return promise;
        };
        async function* gen() {
            yield doAsync('one');
            yield doAsync('two');
            yield doAsync('three');
        }

        const channel = new Channel({ source: gen(), append: true }, 'loading');
        fixture.append(runCompose(channel, elementWithAnchor));
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>loading<!--az:1--></div>"`);

        resolve();
        await find('one');
        // First value REPLACES initial.
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>one<!--az:1--></div>"`);

        resolve();
        await find('onetwo');
        // Subsequent value APPENDS.
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>onetwo<!--az:2--></div>"`);

        resolve();
        await find('onetwothree');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>onetwothree<!--az:3--></div>"`);
    });

    test('ReadableStream source', async ({ expect, fixture, find }) => {
        let push, close;
        const stream = new ReadableStream({
            start(controller) {
                push = (v) => controller.enqueue(v);
                close = () => controller.close();
            }
        });

        const channel = new Channel({ source: stream, append: true }, 'loading');
        fixture.append(runCompose(channel, elementWithAnchor));
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>loading<!--az:1--></div>"`);

        push('a');
        await find('a');
        // Initial replaced.
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>a<!--az:1--></div>"`);

        push('b');
        await find('ab');
        // Accumulates.
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>ab<!--az:2--></div>"`);

        close();
    });

    test('observable source', async ({ expect, fixture, find }) => {
        let emit;
        const observable = {
            subscribe(observer) {
                emit = (v) => observer.next(v);
                return { unsubscribe() { } };
            }
        };

        const channel = new Channel({ source: observable, append: true }, 'loading');
        fixture.append(runCompose(channel, elementWithAnchor));
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>loading<!--az:1--></div>"`);

        emit('one');
        await find('one');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>one<!--az:1--></div>"`);

        emit('two');
        await find('onetwo');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>onetwo<!--az:2--></div>"`);
    });

    test('Promise source (single value — append is functionally a no-op)', async ({ expect, fixture, find }) => {
        const channel = new Channel(
            { source: Promise.resolve('resolved'), append: true },
            'loading',
        );
        fixture.append(runCompose(channel, elementWithAnchor));
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>loading<!--az:1--></div>"`);

        await find('resolved');
        // First (and only) value replaces initial. Same as without append.
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>resolved<!--az:1--></div>"`);
    });

});

describe('Channel without append (default): each source value replaces', () => {

    test('async iterator: subsequent values replace one another', async ({ expect, fixture, find }) => {
        let resolve = null;
        const doAsync = async (value) => {
            const { promise, resolve: res } = Promise.withResolvers();
            resolve = () => res(value);
            return promise;
        };
        async function* gen() {
            yield doAsync('one');
            yield doAsync('two');
            yield doAsync('three');
        }

        const channel = new Channel({ source: gen() }, 'loading');
        fixture.append(runCompose(channel, elementWithAnchor));
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>loading<!--az:1--></div>"`);

        resolve();
        await find('one');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>one<!--az:1--></div>"`);

        resolve();
        await find('two');
        // Replaces, doesn't accumulate.
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>two<!--az:1--></div>"`);

        resolve();
        await find('three');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<div>three<!--az:1--></div>"`);
    });

});
