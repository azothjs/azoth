import '../with-resolvers-polyfill.js';
import { test } from 'vitest';
import { reduce } from './reduce.js';

// Set up a consumer that resolves a promise each time it reads a value, so
// tests can await the actual read landing rather than guess at microtask
// counts. (vitest fake timers would also work — keeping this self-contained.)
function startReader(iter) {
    const reads = [];
    let resolveNext;
    let nextRead = new Promise(r => resolveNext = r);
    (async () => {
        for await(const value of iter) {
            reads.push(value);
            const r = resolveNext;
            nextRead = new Promise(res => resolveNext = res);
            r();
        }
    })();
    return {
        reads,
        nextRead: () => nextRead,
    };
}

test('reducer', async ({ expect }) => {
    const [iter, dispatch] = reduce((a = 0, b = 0) => a + b);
    const reader = startReader(iter);

    dispatch(2);
    await reader.nextRead();
    expect(reader.reads).toEqual([2]);

    dispatch(3);
    await reader.nextRead();
    expect(reader.reads).toEqual([2, 5]);
});

test('reducer, init', async ({ expect }) => {
    // Init state is in the caller's scope — they pair it with maya's Channel
    // if they want it rendered before the first dispatch.
    const init = 3;
    const [iter, dispatch] = reduce((a = 0, b = 0) => a + b, init);
    const reader = startReader(iter);

    dispatch(2);
    await reader.nextRead();
    expect(reader.reads).toEqual([5]); // 3 + 2
});
