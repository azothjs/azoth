import { test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { subject } from './generators.js';
import { repeat } from './repeat.js';

beforeEach(fixtureSetup);

test('promise with default 2', async ({ expect }) => {
    const { promise, resolve } = Promise.withResolvers();
    const [one, two, shouldBeNull] = repeat(promise);
    resolve('re');
    const resolved = await Promise.all([one, two, shouldBeNull]);
    expect(resolved).toEqual(['re', 're', undefined]);
});

test('promise with count', async ({ expect }) => {
    const { promise, resolve } = Promise.withResolvers();
    const repeated = repeat(promise, 4);
    resolve('re');
    const resolved = await Promise.all(repeated);
    expect(resolved).toEqual(['re', 're', 're', 're']);
});

test('async iterator with default 2', async ({ expect, fixture, find }) => {
    let name = 'pete';
    const [iterator, dispatch] = subject(value => name = value, { startWith: name });
    const [one, two, shouldBeNull] = repeat(iterator);
    fixture.append(<p>{one} {two} {shouldBeNull}</p>);

    await find('pete', { exact: false });
    expect(fixture.innerHTML).toMatchInlineSnapshot(
        `"<p>pete<!--1--> pete<!--1--> <!--0--></p>"`
    );

    dispatch('repete');
    await find('repete', { exact: false });
    expect(fixture.innerHTML).toMatchInlineSnapshot(
        `"<p>repete<!--1--> repete<!--1--> <!--0--></p>"`
    );
});

test('async iterator with count', async ({ expect, fixture, find }) => {
    let name = 'pete';
    const [iterator, dispatch] = subject(value => name = value, { startWith: name });
    const [one, two, three] = repeat(iterator, 3);
    fixture.append(<p>{one} {two} {three}</p>);

    await find('pete', { exact: false });
    expect(fixture.innerHTML).toMatchInlineSnapshot(
        `"<p>pete<!--1--> pete<!--1--> pete<!--1--></p>"`
    );

    dispatch('repete');
    await find('repete', { exact: false });
    expect(fixture.innerHTML).toMatchInlineSnapshot(
        `"<p>repete<!--1--> repete<!--1--> repete<!--1--></p>"`
    );
});

