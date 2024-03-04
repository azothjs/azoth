import { test } from 'vitest';
import { findByText } from '@testing-library/dom';
import { use } from './channels.js';
import { beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';

beforeEach(async context => {
    document.body.innerHTML = '';
    context.fixture = document.body;
    context.find = (filter, options) => findByText(context.fixture, filter, options);
});

const Cat = ({ name }) => <p>{name}</p>;
const Loading = () => <p>loading...</p>;

test('promise only (for api consistency)', async ({ fixture, find, expect }) => {
    const promise = Promise.resolve(Cat({ name: 'felix' }));
    const [LayoutChannel] = use(promise);
    fixture.append(<LayoutChannel />);
    const dom = await find('felix');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
});

test('transform', async ({ fixture, find, expect }) => {
    const promise = Promise.resolve({ name: 'felix' });
    const [LayoutChannel] = use(promise, Cat);
    fixture.append(<LayoutChannel />);
    const dom = await find('felix');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
});

test('transform, { startWith }', async ({ fixture, find, expect }) => {
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

const CatCount = cats => <p>{cats.length} cats</p>;
const CatList = cats => <ul>{cats.map(name => <Cat name={name} />)}</ul>;

test('branch ...transforms', async ({ fixture, find, expect }) => {
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

test('branch [transform, { startWith }], transform', async ({ fixture, find, expect }) => {
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
    `
    );
});
