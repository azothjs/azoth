import { describe, test } from 'vitest';
import { findByText } from '@testing-library/dom';
import { use } from './channels.js';
import { beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { subject } from './generators.js';

beforeEach(async context => {
    document.body.innerHTML = '';
    context.fixture = document.body;
    context.find = (filter, options) => findByText(context.fixture, filter, options);
});

const Cat = ({ name }) => <p>{name}</p>;
const Loading = () => <p>loading...</p>;
const CatCount = cats => <p>{cats.length} cats</p>;
const CatList = cats => <ul>{cats.map(name => <Cat name={name} />)}</ul>;

describe('Arguments', () => {
    test('null options not channel', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();
        const [squarePromise, notAChannel] = use(promise, x => x ** 2, null);
        resolve(3);
        const square = await squarePromise;
        expect(square).toBe(9);
        expect(notAChannel).not.toBeDefined();
    });
});

describe('Promise', () => {

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

    test('channel, { startWith }', async ({ fixture, find, expect }) => {
        const { promise, resolve } = Promise.withResolvers();
        const [LayoutChannel] = use(promise, Cat, {
            startWith: <Loading />
        });
        fixture.append(<>{LayoutChannel}</>);

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
        fixture.append(<>{LayoutChannel}</>);
        // test that a fast resolve is the first await "find"
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
    });

    test('branch ...channels', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve(['felix', 'duchess', 'stimpy']);
        const [CountChannel, ListChannel] = use(promise, CatCount, CatList);
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

    test('branch [channel, { startWith }], channel', async ({ fixture, find, expect }) => {
        const { promise, resolve } = Promise.withResolvers();
        const [ListChannel, CountChannel] = use(
            promise,
            [CatList, { startWith: <Loading /> }],
            CatCount
        );

        fixture.append(<CountChannel />, <ListChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<!--0--><!--0-->"`
        );

        await find('loading...');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<!--0--><p>loading...</p><!--1-->"`
        );

        // trigger promise resolution post-loading
        resolve(['felix', 'duchess', 'stimpy']);

        await Promise.all([find('felix'), find('3 cats')]);
        expect(fixture).toMatchInlineSnapshot(
            `
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

});

describe('Async Iterator', () => {

    test('async iterator only', async ({ fixture, find, expect }) => {
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


    class CatDetail {
        get name() { return this.p.textContent; }
        set name(name) { this.p.textContent = name; }

        render({ name }) {
            return this.p = <p>{name}</p>;
        }
    }

    test.todo('channel, { output: each|once|none }', async ({ fixture, find, expect }) => {
        let cat = { name: 'felix' };
        const [catAsync, setCat] = subject(value => cat = value, {
            startWith: cat
        });

        // const Cat = <Cat />
        use(catAsync, cat => {

        }, { first: cat => <Cat name={cat.name} /> });

        fixture.append(<CatLayout />);
        await find('felix', { exact: false });
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);

        // dispatch({ name: 'duchess' });
        // await find('duchess');
        // expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);

    });

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
        const [catChannel, dispatch] = subject(value => cat = value, {
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

        const [CountChannel, ListChannel] = use(catsChannel, CatCount, CatList);
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

    test('branch [channel, { startWith }], channel', async ({ fixture, find, expect }) => {
        const [cats, dispatch] = subject();
        const [ListChannel, CountChannel] = use(cats,
            [CatList, { startWith: <Loading /> }],
            CatCount
        );

        fixture.append(<CountChannel />, <ListChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<!--0--><!--0-->"`
        );

        await find('loading...');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<!--0--><p>loading...</p><!--1-->"`
        );

        dispatch(['felix', 'duchess', 'stimpy']);

        await Promise.all([find('felix'), find('3 cats')]);
        expect(fixture).toMatchInlineSnapshot(
            `
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
});