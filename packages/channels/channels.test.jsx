import { test } from 'vitest';
import { findByText } from '@testing-library/dom';
import { Channel } from './channels.js';
import { beforeEach } from 'vitest';

beforeEach(async context => {
    document.body.innerHTML = '';
    context.fixture = document.body;
    context.find = filter => findByText(context.fixture, filter, { exact: false });
});

const Cat = ({ name }) => <p>{name}</p>;
const Loading = () => <p>loading...</p>;

test('promise only (for api consistency)', async ({ fixture, find, expect }) => {
    const promise = Promise.resolve(Cat({ name: 'felix' }));
    const [LayoutChannel] = Channel.from(promise);
    fixture.append(<LayoutChannel />);
    const dom = await find('felix');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p>"`);
});

test('transform', async ({ fixture, find, expect }) => {
    const promise = Promise.resolve({ name: 'felix' });
    const [LayoutChannel] = Channel.from(promise, Cat);
    fixture.append(<LayoutChannel />);
    const dom = await find('felix');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p>"`);
});

test('transform, { startWith }', async ({ fixture, find, expect }) => {
    const { promise, resolve } = Promise.withResolvers();
    const [LayoutChannel] = Channel.from(promise, Cat, {
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
    const [LayoutChannel] = Channel.from(promise, Cat, {
        startWith: <Loading />
    });
    fixture.append(<>{LayoutChannel}</>);
    // test that a fast resolve is the first await "find"
    let dom = await find('felix');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p>"`);
});

const CatCount = cats => <p>{cats.length} cats</p>;
const CatList = cats => <ul>{cats.map(name => <Cat name={name} />)}</ul>;

test('branch ...transforms', async ({ fixture, find, expect }) => {
    const promise = Promise.resolve(['felix', 'duchess', 'stimpy']);
    const [CountChannel, ListChannel] = Channel.from(promise, CatCount, CatList);
    fixture.append(<CountChannel />, <ListChannel />);

    const [felix, count] = await Promise.all([find('felix'), find('3 cats')]);
    expect(felix.parentNode.outerHTML).toMatchInlineSnapshot(`"<ul><p>felix<!--1--></p><p>duchess<!--1--></p><p>stimpy<!--1--></p><!--3--></ul>"`);
    expect(count.outerHTML).toMatchInlineSnapshot(`"<p>3<!--1--> cats</p>"`);
});

test('branch [transform, { startWith }], transform', async ({ fixture, find, expect }) => {
    const { promise, resolve } = Promise.withResolvers();
    const [ListChannel, CountChannel] = Channel.from(
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
    expect(fixture.innerHTML).toMatchInlineSnapshot(
        `"<p>3<!--1--> cats</p><!--1--><ul><p>felix<!--1--></p><p>duchess<!--1--></p><p>stimpy<!--1--></p><!--3--></ul><!--1-->"`
    );
});
