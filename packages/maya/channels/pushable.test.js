import { describe, test } from 'vitest';
import { pushable } from './pushable.js';

describe('pushable — bridge from push to pull', () => {

    test('values pushed before iteration are queued and yielded in order', async ({ expect }) => {
        const [iter, push] = pushable();
        push('a');
        push('b');
        push('c');

        // Drain just three values (iterator never naturally ends)
        const out = [];
        for(let i = 0; i < 3; i++) {
            const { value } = await iter.next();
            out.push(value);
        }
        expect(out).toEqual(['a', 'b', 'c']);
    });

    test('value pushed while consumer is awaiting wakes the pending resolver', async ({ expect }) => {
        const [iter, push] = pushable();

        // Start awaiting before any push has happened
        const next = iter.next();
        // Push after the awaiter is parked
        queueMicrotask(() => push('hello'));

        const { value } = await next;
        expect(value).toBe('hello');
    });

    test('mixed: some queued, some awaited', async ({ expect }) => {
        const [iter, push] = pushable();
        push('queued');

        const first = await iter.next();
        expect(first.value).toBe('queued');

        // Now nothing queued — next consumer awaits
        const second = iter.next();
        queueMicrotask(() => push('live'));
        expect((await second).value).toBe('live');
    });

    test('iterator does not naturally complete', async ({ expect }) => {
        const [iter, push] = pushable();
        push('only-value');

        const { value, done } = await iter.next();
        expect(value).toBe('only-value');
        expect(done).toBe(false);
        // No more pushes — calling .next() would block waiting for one;
        // we don't await it here because there's no termination signal.
    });

    test('iterator can be returned (consumer abandonment)', async ({ expect }) => {
        const [iter, push] = pushable();
        push('a');

        const first = await iter.next();
        expect(first.value).toBe('a');

        // Consumer abandons: signal done.
        const ret = await iter.return();
        expect(ret.done).toBe(true);
    });

    test('push after iterator return is a silent no-op', async ({ expect }) => {
        const [iter, push] = pushable();
        await iter.return();

        // Pushing into an abandoned iterator should not throw.
        expect(() => push('lost')).not.toThrow();
    });

    test('push receives values verbatim — no transform applied', async ({ expect }) => {
        const [iter, push] = pushable();
        const obj = { complex: 'shape', nested: [1, 2, 3] };
        push(obj);

        const { value } = await iter.next();
        // Same reference — pushable is a passthrough.
        expect(value).toBe(obj);
    });

});
