import { beforeEach, test } from 'vitest';
import './with-resolvers-polyfill.js';
import { findByText } from '@testing-library/dom';
import { fixtureSetup } from 'test-utils/fixtures';
import { subject } from './generators.js';

/* 
    Subject usually is a data provider that is then use(d), but it can be used 
    directly by compose as it is an async iterator (assuming the emitted values
    can be DOM appended). It exposes a sync start method that uses a class instance
    exposed from compose. Instead of creating a stand-alone test harness, this test 
    file reuses the async consumption logic in compose to produce test values.
    Which also serves to provide more integration test coverage for compose.
*/

beforeEach(fixtureSetup);

test('subject()', async ({ fixture, find, expect }) => {
    const [asyncIterator, next] = subject();
    fixture.append(<>{asyncIterator}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);
    next('test');
    await find('test');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"test<!--1-->"`);

});

test('transform', async ({ fixture, find, expect }) => {
    const [asyncIterator, next] = subject(s => s?.toUpperCase());
    fixture.append(<>{asyncIterator}</>);

    next('hello');
    await find('HELLO');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"HELLO<!--1-->"`);
    next();
    await find('');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);
});

test('options.start', async ({ fixture, find, expect }) => {
    const [wrappedAsync, next] = subject({ start: 'hi' });
    fixture.append(<>{wrappedAsync}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"hi<!--1-->"`);
    next('yo');
    await find('yo');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"yo<!--1-->"`);
});

test('options.start skips transform', async ({ fixture, find, expect }) => {
    const [wrappedAsync, next] = subject(s => s?.toUpperCase(), { start: 'hi' });
    fixture.append(<>{wrappedAsync}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"hi<!--1-->"`);
    next('yo');
    await find('YO');
});


test('options.init', async ({ fixture, find, expect }) => {
    const [wrappedAsync, next] = subject(x => x ** 2, { init: 2 });
    fixture.append(<>{wrappedAsync}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"4<!--1-->"`);
    next(3);
    await find('9');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"9<!--1-->"`);

});

const sleep = (ms) => {
    const { promise, resolve } = Promise.withResolvers();
    setTimeout(resolve, ms);
    return promise;
};

test('both start and init', async ({ expect, find, fixture }) => {
    const [wrappedAsync, next] = subject(
        x => Promise.resolve(x ** 2),
        { init: 2, start: 42 }
    );

    fixture.append(<>{wrappedAsync}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"42<!--1-->"`);

    await find('4');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"4<!--1-->"`);

    next(3);
    await find('9');

    expect(fixture.innerHTML).toMatchInlineSnapshot(`"9<!--1-->"`);

});

test.todo('options.error');


