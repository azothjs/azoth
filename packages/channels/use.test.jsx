import { describe, test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { subject } from './generators.js';
import { branch, channel, use } from './use.js';
import { waitForElementToBeRemoved } from '@testing-library/dom';

beforeEach(fixtureSetup);

const Loading = () => <p>loading...</p>;
const Cat = ({ name }) => <p>{name}</p>;
const CatList = cats => <ul>{cats.map(Cat)}</ul>;
const CatCount = cats => <p>{cats.length} cats</p>;
const CatName = ({ name }) => <li>{name}</li>;
const CatNames = cats => <ul>{cats.map(name => <CatName name={name} />)}</ul>;

describe('channel', () => {

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
    });

    describe('Sync, start, init, option rules', () => {

        test('Sync', async ({ fixture, find, expect }) => {
            const [cat, next] = subject({ start: 'felix' });

            const CatChannel = channel(cat);
            fixture.append(<CatChannel />);
            expect(fixture.innerHTML).toMatchInlineSnapshot(`"felix<!--1-->"`);

            next('duchess');
            await find('duchess');
            expect(fixture.innerHTML).toMatchInlineSnapshot(`"duchess<!--1-->"`);
        });

        test('Sync, transform', async ({ fixture, find, expect }) => {
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

        test('Sync, transform, { map: true }', async ({ fixture, find, expect }) => {
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
    });

});

describe('branch promise', () => {

    beforeEach(context => {
        context.childHTML = () => [
            ...context.fixture.childNodes
        ].map(cn => cn.outerHTML ?? cn);
    });

    test('...transforms', async ({ fixture, find, expect, childHTML }) => {
        const promise = Promise.resolve(['felix', 'duchess', 'stimpy']);
        const [Count, List] = branch(promise, CatCount, CatNames);
        fixture.append(<Count />, <List />);

        await Promise.all([find('felix'), find('3 cats')]);
        expect(childHTML())
            .toMatchInlineSnapshot(`
              [
                "<p>3<!--1--> cats</p>",
                <!--1-->,
                "<ul><li>felix<!--1--></li><li>duchess<!--1--></li><li>stimpy<!--1--></li><!--3--></ul>",
                <!--1-->,
              ]
            `);
    });

    test('all transform/option combos', async ({
        fixture, find, expect, childHTML
    }) => {
        const { promise, resolve } = Promise.withResolvers();

        const Channels = branch(
            promise,
            [null, { start: 'start-' }],
            [null, { init: 'init-' }],
            [name => 'second-', { start: 'first-' }],
            [name => name.toUpperCase(), { init: 'felix' }],
            null,
            name => `-${name}!`,
            [name => name[0]],
        );

        expect(Channels.length).toBe(7);
        fixture.append(<>{Channels.map(Channel => <p><Channel /></p>)}</>);
        expect(childHTML()).toMatchInlineSnapshot(`
          [
            "<p>start-<!--1--><!--1--></p>",
            "<p>init-<!--1--><!--1--></p>",
            "<p>first-<!--1--><!--1--></p>",
            "<p>FELIX<!--1--><!--1--></p>",
            "<p><!--0--><!--1--></p>",
            "<p><!--0--><!--1--></p>",
            "<p><!--0--><!--1--></p>",
            <!--7-->,
          ]
        `);

        resolve('cat-');

        await find('c');
        expect(childHTML()).toMatchInlineSnapshot(`
          [
            "<p>cat-<!--1--><!--1--></p>",
            "<p>cat-<!--1--><!--1--></p>",
            "<p>second-<!--1--><!--1--></p>",
            "<p>CAT-<!--1--><!--1--></p>",
            "<p>cat-<!--1--><!--1--></p>",
            "<p>-cat-!<!--1--><!--1--></p>",
            "<p>c<!--1--><!--1--></p>",
            <!--7-->,
          ]
        `);

    });
});

describe('async iterator', () => {

    test.skip('branch ...channels', async ({ fixture, find, expect }) => {
        let cats = ['felix', 'duchess', 'stimpy'];
        const [catsChannel, dispatch] = subject(value => cats = value, {
            startWith: cats
        });

        const [CountChannel, ListChannel] = use(catsChannel, CatCount);
        fixture.append(<CountChannel />, <ListChannel />);

        await Promise.all([find('felix'), find('3 cats')]);
        expect(fixture).toMatchInlineSnapshot(`
          <body>
            <p>
              3
              <!--1-->
               cats
            </p>
            <!--1-->
            <ul>
              <p>
                felix
                <!--1-->
              </p>
              <p>
                duchess
                <!--1-->
              </p>
              <p>
                stimpy
                <!--1-->
              </p>
              <!--3-->
            </ul>
            <!--1-->
          </body>
        `);

        dispatch(['garfield']);
        await Promise.all([find('garfield'), find('1 cats')]);
        expect(fixture).toMatchInlineSnapshot(`
          <body>
            <p>
              1
              <!--1-->
               cats
            </p>
            <!--1-->
            <ul>
              <p>
                garfield
                <!--1-->
              </p>
              <!--1-->
            </ul>
            <!--1-->
          </body>
        `);
    });

    test.skip('branch options', async ({ fixture, find, findAll, expect }) => {
        const [cats, dispatch] = subject();

        const [ListChannel, MapChannel, CountChannel] = use(
            cats,
            [CatList, { startWith: <Loading /> }],
            [Cat, { map: true }],
            CatCount
        );
        fixture.append(<ListChannel />, <MapChannel />, <CountChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<!--0--><!--0--><!--0-->"`
        );

        await find('loading...');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>loading...</p><!--1--><!--0--><!--0-->"`
        );

        dispatch([
            { name: 'felix' },
            { name: 'duchess' },
            { name: 'garfield' }
        ]);

        await findAll('felix');
        expect(fixture).toMatchInlineSnapshot(
            `
          <body>
            <ul>
              <p>
                felix
                <!--1-->
              </p>
              <p>
                duchess
                <!--1-->
              </p>
              <p>
                garfield
                <!--1-->
              </p>
              <!--3-->
            </ul>
            <!--1-->
            <p>
              felix
              <!--1-->
            </p>
            <p>
              duchess
              <!--1-->
            </p>
            <p>
              garfield
              <!--1-->
            </p>
            <!--3-->
            <p>
              3
              <!--1-->
               cats
            </p>
            <!--1-->
          </body>
        `
        );

        dispatch([]);
        await waitForElementToBeRemoved(fixture.firstChild);

        expect(fixture).toMatchInlineSnapshot(
            `
          <body>
            <ul>
              <!--0-->
            </ul>
            <!--1-->
            <!--0-->
            <p>
              0
              <!--1-->
               cats
            </p>
            <!--1-->
          </body>
        `
        );

        dispatch([{ name: 'stimpy' }]);
        await findAll('stimpy');
        expect(fixture).toMatchInlineSnapshot(`
          <body>
            <ul>
              <p>
                stimpy
                <!--1-->
              </p>
              <!--1-->
            </ul>
            <!--1-->
            <p>
              stimpy
              <!--1-->
            </p>
            <!--1-->
            <p>
              1
              <!--1-->
               cats
            </p>
            <!--1-->
          </body>
        `);
    });

});