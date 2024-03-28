import '../with-resolvers-polyfill.js';
import { test } from 'vitest';
import { unicast } from './unicast.js';
import { SyncAsyncReader } from '../test-utils.jsx';

test('unicast()', async ({ expect }) => {
    const [async, next] = unicast();
    const reader = new SyncAsyncReader(async);
    expect(reader.state).toBeUndefined();

    next('test');
    await reader.promise;
    expect(reader.state).toBe('test');

    next();
    await reader.promise;
    expect(reader.state).toBeUndefined();

});

test('transform', async ({ expect }) => {
    const [async, next] = unicast(s => s?.toUpperCase());
    const reader = new SyncAsyncReader(async);
    expect(reader.state).toBeUndefined();

    next('hello');
    await reader.promise;
    expect(reader.state).toBe('HELLO');
});

test('transform, init', async ({ expect }) => {
    const [syncAsync, next] = unicast(x => x ** 2, 2);
    const reader = new SyncAsyncReader(syncAsync);
    expect(reader.state).toBe(4);

    next(3);
    await reader.promise;
    expect(reader.state).toBe(9);
});

test('init', async ({ expect }) => {
    const [syncAsync, next] = unicast(2);
    const reader = new SyncAsyncReader(syncAsync);
    expect(reader.state).toBe(2);

    next(3);
    await reader.promise;
    expect(reader.state).toBe(3);
});

test('throw if transform not function', ({ expect }) => {
    expect(() => {
        unicast(2, 2);
    }).toThrowErrorMatchingInlineSnapshot(`
      [TypeError: The "transform" argument must be a function. If you want to use an initial value with no function, pass "null" as the first argument to "unicast". Received:

      2

      ]
    `);
});
