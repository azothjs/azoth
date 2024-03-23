import { describe, test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { subject } from './generators.js';
import { channel } from './channel.js';
import { sleep } from '../../test-utils/sleep.js';
import { Cat } from './test-cats.jsx';

beforeEach(fixtureSetup);

describe('promise', () => {

    test('promise only', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve('felix');
        const CatChannel = channel(promise);
        fixture.append(<CatChannel />);

        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"felix<!--1-->"`);
    });

    test('transform', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve({ name: 'felix' });
        const CatChannel = channel(promise, Cat);
        fixture.append(<CatChannel />);

        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
    });

    test('transform, { map: true }', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve([
            { name: 'felix' },
            { name: 'duchess' },
            { name: 'garfield' }
        ]);
        const Cats = channel(promise, Cat, { map: true });
        fixture.append(<Cats />);

        await find('felix', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>felix<!--1--></p><p>duchess<!--1--></p><p>garfield<!--1--></p><!--3-->"`
        );
    });

    test('transform, { start, init }', async ({ fixture, find, expect }) => {
        const promise = sleep(50).then(() => 'duchess');

        const Cat = channel(promise, async name => {
            return name === 'felix'
                ? <p>FELIX FTW</p>
                : <p>{name}</p>;
        }, {
            init: 'felix',
            start: 'choose wisely',
        });


        fixture.append(<Cat />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"choose wisely<!--1-->"`);

        await find('FELIX FTW');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>FELIX FTW</p><!--1-->"`
        );

        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>duchess<!--1--></p><!--1-->"`
        );
    });
});

describe('async iterator', () => {

    test('iterator only', async ({ fixture, find, expect }) => {
        const [iterator, next] = subject();

        const CatChannel = channel(iterator);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);

        next(<Cat name='felix' />);
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);

        next(<Cat name='duchess' />);
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);
    });

    test('transform', async ({ fixture, find, expect }) => {
        const [cat, next] = subject();

        const CatChannel = channel(cat, Cat);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);

        next({ name: 'duchess' });
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);

        next({ name: 'garfield' });
        await find('garfield');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>garfield<!--1--></p><!--1-->"`);
    });

    test('transform, { map: true }', async ({ fixture, find, expect }) => {
        const [cats, dispatch] = subject();

        const Cats = channel(cats, Cat, { map: true });
        fixture.append(<ul><Cats /></ul>);

        dispatch([
            { name: 'felix' },
            { name: 'duchess' },
            { name: 'garfield' }
        ]);

        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<ul><p>felix<!--1--></p><p>duchess<!--1--></p><p>garfield<!--1--></p><!--3--><!--1--></ul>"`
        );
    });

    test('transform, { start, init }', async ({ fixture, find, expect }) => {
        const [cat, next] = subject();

        // const promise = sleep(50).then(() => 'duchess');

        const Cat = channel(cat, async name => {
            return name === 'felix'
                ? <p>FELIX FTW</p>
                : <p>{name}</p>;
        }, {
            init: 'felix',
            start: 'choose wisely',
        });


        fixture.append(<Cat />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"choose wisely<!--1-->"`);

        await find('FELIX FTW');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>FELIX FTW</p><!--1-->"`
        );

        next('duchess');
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>duchess<!--1--></p><!--1-->"`
        );
    });
});

describe('sync, start, init', () => {

    test('sync', async ({ fixture, find, expect }) => {
        const [cat, next] = subject({
            start: 'felix'
        });

        const CatChannel = channel(cat);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"felix<!--1-->"`);

        next('duchess');
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"duchess<!--1-->"`);
    });

    test('sync, transform', async ({ fixture, find, expect }) => {
        const [cat, next] = subject({
            start: { name: 'felix' }
        });

        const CatChannel = channel(cat, Cat);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);

        next({ name: 'duchess' });
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);
    });

    test('sync, transform, { map: true }', async ({ fixture, find, expect }) => {
        const [cats, next] = subject({
            start: [
                { name: 'felix' },
                { name: 'duchess' },
                { name: 'garfield' }
            ]
        });

        const Cats = channel(cats, Cat, { map: true });
        fixture.append(<ul><Cats /></ul>);

        next([
            { name: 'tom' },
            { name: 'stimpy' },
        ]);

        await find('tom');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<ul><p>tom<!--1--></p><p>stimpy<!--1--></p><!--2--><!--1--></ul>"`
        );
    });

    test('{ start }', async ({ fixture, find, expect }) => {
        const [cat, next] = subject();

        const CatChannel = channel(cat, { start: 'felix' });
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"felix<!--1-->"`
        );

        next('duchess');
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"duchess<!--1-->"`
        );
    });

    test('{ init }', async ({ fixture, find, expect }) => {
        const [cat, next] = subject();

        const CatChannel = channel(cat, { init: 'felix' });

        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"felix<!--1-->"`
        );

        next('stimpy');
        await find('stimpy');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"stimpy<!--1-->"`
        );
    });

    test('transform, { init }', async ({ fixture, find, expect }) => {
        const [cat, next] = subject();

        const CatChannel = channel(cat, name => {
            return name === 'felix'
                ? <p>FELIX FTW</p>
                : <p>{name}</p>;
        }, { init: 'felix' });

        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>FELIX FTW</p><!--1-->"`
        );

        next('stimpy');
        await find('stimpy');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>stimpy<!--1--></p><!--1-->"`
        );
    });

    test('throws: { map: true } w/o transform', async ({ expect }) => {
        expect(() => {
            channel(Promise.resolve(), { map: true });
        }).toThrowErrorMatchingInlineSnapshot(
            `[TypeError: More arguments needed: option "map: true" requires a mapping function.]`
        );
    });

    test('throws: sync, { init }', async ({ expect }) => {
        const [cat] = subject({ start: 'felix' });
        expect(() => {
            channel(cat, { init: 'will throw' });
        }).toThrowErrorMatchingInlineSnapshot(
            `[TypeError: Option "init" was supplied with an asynchronous data provider that already has been wrapped with a synchronous initial value to be provided as the initial input of this channel. Use one or the other, but not both.]`
        );
    });
});

