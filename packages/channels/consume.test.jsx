import { describe, test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { subject } from './generators.js';
import { use } from './use.js';
import { consume } from './consume.js';

beforeEach(fixtureSetup);

const Loading = () => <p>loading...</p>;
const Cat = ({ name }) => <p>{name}</p>;
const CatCount = cats => <p>{cats.length} cats</p>;
const CatList = cats => <ul>{cats.map(name => <Cat name={name} />)}</ul>;

describe('promise', () => {

    test('promise single action', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();

        let received = '';
        consume(promise, cat => received = cat);
        resolve('felix');
        await promise;
        expect(received).toBe('felix');
    });

    test('promise actions', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();

        const received = [];
        consume(promise,
            name => received.push(`${name} 1`),
            name => received.push(`${name} 2`),
            name => received.push(`${name} 3`),
        );
        await resolve('felix');
        expect(received).toEqual([
            'felix 1',
            'felix 2',
            'felix 3',
        ]);
    });



    test.todo('branch ...channels', async ({ fixture, find, expect }) => {
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

    test.todo('branch [channel, { start }], channel', async ({ fixture, find, expect }) => {
        const { promise, resolve } = Promise.withResolvers();

        const [ListChannel, CountChannel] = use(
            promise,
            [CatList, { start: <Loading /> }],
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
            start: cat
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

    test('channel, { start }', async ({ fixture, find, expect }) => {
        const [cat, dispatch] = subject();

        const [LayoutChannel] = use(cat, Cat, {
            start: <Loading />
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

    test('fast resolve with { start }', async ({ fixture, find, expect }) => {
        let cat = { name: 'felix' };
        const [catChannel, dispatch] = subject(value => cat = value, {
            start: cat
        });

        const [LayoutChannel] = use(catChannel, Cat, {
            start: <Loading />
        });
        fixture.append(<>{LayoutChannel}</>);

        // test that a fast resolve is the first await "find"
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
    });

    test('branch ...channels', async ({ fixture, find, expect }) => {
        let cats = ['felix', 'duchess', 'stimpy'];
        const [catsChannel, dispatch] = subject(value => cats = value, {
            start: cats
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

    test('branch [channel, { start }], channel', async ({ fixture, find, expect }) => {
        const [cats, dispatch] = subject();

        const [ListChannel, CountChannel] = use(cats,
            [CatList, { start: <Loading /> }],
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