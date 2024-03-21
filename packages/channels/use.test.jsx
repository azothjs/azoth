import { describe, test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { subject } from './generators.js';
import { use } from './use.js';
import { waitForElementToBeRemoved } from '@testing-library/dom';

beforeEach(fixtureSetup);

const Loading = () => <p>loading...</p>;
const Cat = ({ name }) => <p>{name}</p>;
const CatCount = cats => <p>{cats.length} cats</p>;
const CatList = cats => <ul>{cats.map(Cat)}</ul>;
const CatNameList = cats => <ul>{cats.map(name => <Cat name={name} />)}</ul>;

describe('arguments', () => {
    test('null options not channel', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();

        const [squarePromise, notAChannel] = use(promise, x => x ** 2, null);

        resolve(3);
        const square = await squarePromise;
        expect(square).toBe(9);
        expect(notAChannel).not.toBeDefined();
    });
});

describe('promise', () => {

    test('promise only', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve(Cat({ name: 'felix' }));

        const [LayoutChannel] = use(promise);
        fixture.append(<LayoutChannel />);

        const dom = await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
    });

    test('channel', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve({ name: 'felix' });

        const [LayoutChannel] = use(promise, Cat);
        fixture.append(<LayoutChannel />);

        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
    });

    test('channel, { map: true }', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve([
            { name: 'felix' },
            { name: 'duchess' },
            { name: 'garfield' }
        ]);

        const [LayoutChannel] = use(promise, Cat, { map: true });
        fixture.append(<LayoutChannel />);

        await find('felix', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>felix<!--1--></p><p>duchess<!--1--></p><p>garfield<!--1--></p><!--3-->"`
        );
    });

    test('throws: { map: true } w/o channel', async ({ expect }) => {
        expect(() => {
            use(Promise.resolve(), { map: true });
        }).toThrowErrorMatchingInlineSnapshot(
            `[TypeError: More arguments needed: option "map: true" requires a mapping function.]`);
    });

    test('channel, { startWith }', async ({ fixture, find, expect }) => {
        const { promise, resolve } = Promise.withResolvers();

        const [LayoutChannel] = use(promise, Cat, {
            startWith: <Loading />
        });
        fixture.append(<LayoutChannel />);

        await find('loading...');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>loading...</p><!--1-->"`
        );

        // trigger promise resolution post-loading
        resolve({ name: 'felix' });
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>felix<!--1--></p><!--1-->"`
        );
    });

    test('fast resolve with { startWith }', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve({ name: 'felix' });

        const [LayoutChannel] = use(promise, Cat, {
            startWith: <Loading />
        });
        fixture.append(<LayoutChannel />);

        // test that a fast resolve is the first async "find",
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>felix<!--1--></p><!--1-->"`
        );
    });

    test('branch ...channels', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve(['felix', 'duchess', 'stimpy']);

        const [CountChannel, ListChannel] = use(promise, CatCount, CatNameList);
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
    });

    test('branch options', async ({ fixture, find, expect }) => {
        const { promise, resolve } = Promise.withResolvers();

        const [ListChannel, MapChannel, CountChannel] = use(
            promise,
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

        resolve([
            { name: 'felix' },
            { name: 'duchess' },
            { name: 'garfield' }
        ]);
        await find('3 cats');
        expect(fixture).toMatchInlineSnapshot(`
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
        `);
    });

});

describe('async iterator', () => {

    test('iterator only', async ({ fixture, find, expect }) => {
        const [iterator, dispatch] = subject();

        const [LayoutChannel] = use(iterator);
        fixture.append(<LayoutChannel />);

        dispatch(<Cat name='felix' />);
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);

        dispatch(<Cat name='duchess' />);
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);
    });

    test('channel', async ({ fixture, find, expect }) => {
        let cat = { name: 'felix' };
        const [catChannel, dispatch] = subject(value => cat = value, {
            startWith: cat
        });

        const [LayoutChannel] = use(catChannel, Cat);
        fixture.append(<LayoutChannel />);

        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);

        dispatch({ name: 'duchess' });
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);
    });

    test('channel, { map: true }', async ({ fixture, find, expect }) => {
        const [cats, dispatch] = subject();

        const [Cats] = use(cats, Cat, { map: true });
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


    class CatDetail {
        get name() { return this.p.textContent; }
        set name(name) { this.p.textContent = name; }
        render({ name }) {
            return this.p = <p>{name}</p>;
        }
    }

    test('channel, { startWith }', async ({ fixture, find, expect }) => {
        const [cat, dispatch] = subject();

        const [LayoutChannel] = use(cat, Cat, {
            startWith: <Loading />
        });
        fixture.append(<>{LayoutChannel}</>);

        await find('loading...');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>loading...</p><!--1-->"`
        );

        dispatch({ name: 'felix' });
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>felix<!--1--></p><!--1-->"`
        );
    });

    test('fast resolve with { startWith }', async ({ fixture, find, expect }) => {
        let cat = { name: 'felix' };
        const [catChannel] = subject(value => cat = value, {
            startWith: cat
        });

        const [LayoutChannel] = use(catChannel, Cat, {
            startWith: <Loading />
        });
        fixture.append(<>{LayoutChannel}</>);

        // test that a fast resolve is the first await "find"
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
    });

    test('branch ...channels', async ({ fixture, find, expect }) => {
        let cats = ['felix', 'duchess', 'stimpy'];
        const [catsChannel, dispatch] = subject(value => cats = value, {
            startWith: cats
        });

        const [CountChannel, ListChannel] = use(catsChannel, CatCount, CatNameList);
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

    test('branch options', async ({ fixture, find, findAll, expect }) => {
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