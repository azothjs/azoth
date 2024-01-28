import { test } from 'vitest';
import { pipe } from './events.js';
import './with-resolvers-polyfill.js';

test('pipe', async ({ expect }) => {
    const [signal, iterator] = pipe('/');

    let { value } = await iterator.next();
    expect(value).toBe('/');

    // listen for next call
    let iteratorPromise = iterator.next();
    // fire the event
    signal('/page');
    // check the response
    ({ value } = await iteratorPromise);
    // /page
    expect(value).toBe('/page');

    // set it back
    iteratorPromise = iterator.next();
    signal('/');
    ({ value } = await iteratorPromise);
    expect(value).toBe('/');
});

test('adaptor', async ({ expect }) => {
    const [signal, iterator] = pipe(0, x => x ** x);

    expect((await iterator.next()).value).toBe(0);
    let iteratorPromise = iterator.next();
    signal(2);
    expect((await iteratorPromise).value).toBe(4);
});

