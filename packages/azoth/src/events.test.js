import { test } from 'vitest';
import { eventOperator } from './events.js';
test('events', async ({ expect }) => {
    const { operator, listener } = eventOperator('/');

    const iterator = operator('/');
    let { value } = await iterator.next();
    expect(value).toBe('/');

    // listen for next call
    let iteratorPromise = iterator.next();
    // fire the event
    listener('/page');
    // check the response
    ({ value } = await iteratorPromise);
    // /page
    expect(value).toBe('/page');

    // listen for next call
    iteratorPromise = iterator.next();
    // fire the event
    listener('/');
    // check the response
    ({ value } = await iteratorPromise);
    // /
    expect(value).toBe('/');
});

