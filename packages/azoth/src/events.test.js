import { test } from 'vitest';
import { operator } from './events.js';
import './with-resolvers-polyfill.js';

test('events', async ({ expect }) => {
    const [control, emitter] = operator();

    const iterator = emitter('/');
    let { value } = await iterator.next();
    expect(value).toBe('/');

    // listen for next call
    let iteratorPromise = iterator.next();
    // fire the event
    control('/page');
    // check the response
    ({ value } = await iteratorPromise);
    // /page
    expect(value).toBe('/page');

    // listen for next call
    iteratorPromise = iterator.next();
    // fire the event
    control('/');
    // check the response
    ({ value } = await iteratorPromise);
    // /
    expect(value).toBe('/');
});

