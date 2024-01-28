import { test } from 'vitest';
import { signalIterator } from './events.js';
import './with-resolvers-polyfill.js';

test('events', async ({ expect }) => {
    const [signal, iterator] = signalIterator('/');

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

    // listen for next call
    iteratorPromise = iterator.next();
    // fire the event
    signal('/');
    // check the response
    ({ value } = await iteratorPromise);
    // /
    expect(value).toBe('/');
});

