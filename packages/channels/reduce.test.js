import './with-resolvers-polyfill.js';
import { beforeEach, test } from 'vitest';
import { fixtureSetup } from '../../test-utils/fixtures.js';
import { reduce } from './reduce.js';

// TODO: move away from fixture
beforeEach(fixtureSetup);

class SyncAsyncReader {
    constructor({ sync, async }) {
        this.state = sync;
        this.read(async);
    }
    async read(iter) {
        let { promise, resolve } = Promise.withResolvers();
        this.promise = promise;
        for await(const value of iter) {
            this.state = value;
            resolve();
            ({ promise, resolve } = Promise.withResolvers());
            this.promise = promise;
        }
    }
}

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