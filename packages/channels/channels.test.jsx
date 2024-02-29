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

test('Channel.from(promise, transform)', async ({ fixture, find, expect }) => {
    const promise = Promise.resolve({ name: 'felix' });
    const [LayoutChannel] = Channel.from(promise, Cat);
    fixture.append(<LayoutChannel />);
    const dom = await find('felix');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p>"`);
});

test('Channel.from(promise, transform, { startWith })', async ({ fixture, find, expect }) => {
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
    resolve({ name: 'felix ' });

    dom = await find('felix');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p>felix <!--1--></p>"`);
});
