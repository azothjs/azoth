import { describe, test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { unicast } from './unicast.js';
import { tee } from './tee.js';
import { Sync } from '../maya/compose/compose.js';

beforeEach(fixtureSetup);

describe('promise', () => {
    test('promise default 2', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();
        const tees = tee(promise);
        resolve('tee');
        const resolved = await Promise.all(tees);
        expect(resolved).toEqual(['tee', 'tee']);
    });

    test('promise with count', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();
        const teed = tee(promise, 4);
        resolve('tee');
        const resolved = await Promise.all(teed);
        expect(resolved).toEqual(['tee', 'tee', 'tee', 'tee']);
    });

    test('with initial value', async ({ expect, fixture, find }) => {
        const { promise, resolve } = Promise.withResolvers();

        const Channels = tee(Sync.wrap('init', promise));
        fixture.append(...Channels.map(C => <C />));
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"init<!--1-->init<!--1-->"`
        );

        resolve('pete');
        await find('pete', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"pete<!--1-->pete<!--1-->"`
        );
    });

});

describe('async iterator', () => {

    test.only('default 2', async ({ expect, fixture, find }) => {
        const [iterator, next] = unicast();
        const Channels = tee(iterator);
        fixture.append(...Channels.map(C => <C />));
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<!--0--><!--0-->"`
        );

        next('pete');
        await find('pete', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"pete<!--1-->pete<!--1-->"`
        );

        next('repete');
        await find('repete', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"repete<!--1-->repete<!--1-->"`
        );
    });

    test('count', async ({ expect, fixture, find }) => {
        const [iterator, next] = unicast();
        const [one, two, three] = tee(iterator, 3);
        fixture.append(<p>{one} {two} {three}</p>);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p><!--0--> <!--0--> <!--0--></p>"`
        );

        next('pete');
        await find('pete', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>pete<!--1--> pete<!--1--> pete<!--1--></p>"`
        );

        next('repete');
        await find('repete', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>repete<!--1--> repete<!--1--> repete<!--1--></p>"`
        );
    });

    test('with initial value', async ({ expect, fixture, find }) => {
        const [iterator, next] = unicast({ start: 'first' });
        const [one, two, three] = tee(iterator, 3);
        fixture.append(<p>{one} {two} {three}</p>);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>first<!--1--> first<!--1--> first<!--1--></p>"`
        );

        next('pete');
        await find('pete', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>pete<!--1--> pete<!--1--> pete<!--1--></p>"`
        );

        next('repete');
        await find('repete', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>repete<!--1--> repete<!--1--> repete<!--1--></p>"`
        );
    });
});

describe('throws', () => {
    test('invalid async provider', ({ expect }) => {
        expect(() => {
            tee(null);
        }).toThrowErrorMatchingInlineSnapshot(`
          [TypeError: Missing async provider argument. Received:

          null

          ]
        `);
    });

    test('invalid number', ({ expect }) => {
        expect(() => {
            tee(Promise.resolve(), 'bad input');
        }).toThrowErrorMatchingInlineSnapshot(`[TypeError: tee "count" argument must be a whole number 2 or greater, received "bad input".]`);
    });

    test('at least 2', ({ expect }) => {
        expect(() => {
            tee(Promise.resolve(), 1);
        }).toThrowErrorMatchingInlineSnapshot(`[TypeError: tee "count" argument must be a whole number 2 or greater, received "1".]`);
    });
});


