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
    let dom = null;

    dom = await find('loading...');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p>loading...</p>"`);

    // we delay promise resolution and trigger here to not miss the
    // intermediate "loading...", async testing-library "find"
    // pushes it out too far and it picks up the the "felix".
    resolve({ name: 'felix' });

    dom = await find('felix');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p>"`);
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

test.todo('branch [transform, { startWith }], transform', async ({ fixture, find, expect }) => {
    const promise = Promise.resolve(['felix', 'duchess', 'stimpy']);
    const [CountChannel, ListChannel] = Channel.from(
        promise,
        [CatList, { startWith: <Loading /> }],
        CatCount
    );
    fixture.append(<CountChannel />, <ListChannel />);

    const [felix, count] = await Promise.all([find('felix'), find('3 cats')]);
    expect(felix.outerHTML).toMatchInlineSnapshot(`"<ul><p>felix<!--1--></p><p>duchess<!--1--></p><p>stimpy<!--1--></p><!--3--></ul>"`);
    expect(count.outerHTML).toMatchInlineSnapshot(`"<p>3<!--1--> cats</p>"`);
});