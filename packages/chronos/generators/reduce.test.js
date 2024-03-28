import '../with-resolvers-polyfill.js';
import { test } from 'vitest';
import { SyncAsyncReader } from '../test-utils.jsx';
import { reduce } from './reduce.js';

test('reducer', async ({ expect }) => {
    const [syncAsync, dispatch] = reduce((a = 0, b = 0) => {
        return a + b;
    });
    const reader = new SyncAsyncReader(syncAsync);
    expect(reader.state).toBe(0);

    dispatch(2);
    await reader.promise;
    expect(reader.state).toBe(2);

    dispatch(3);
    await reader.promise;
    expect(reader.state).toBe(5);
});

test('reducer, init', async ({ expect }) => {
    const [syncAsync, dispatch] = reduce((a = 0, b = 0) => {
        return a + b;
    }, 3);
    const reader = new SyncAsyncReader(syncAsync);
    expect(reader.state).toBe(3);

    dispatch(2);
    await reader.promise;
    expect(reader.state).toBe(5);
});