import { beforeEach, test } from 'vitest';
import { findByText } from '@testing-library/dom';
import { elementWithAnchor, runCompose } from '../test-utils/elements.test.js';
import '../test-utils/with-resolvers-polyfill.js';
import { subject } from './generators.js';

beforeEach(() => document.body.innerHTML = '');

const getDOM = asyncIterator => {
    const dom = runCompose(asyncIterator, elementWithAnchor);
    document.body.append(dom);
    return dom;
};

test('subject()', async () => {
    const [asyncIterator, dispatch] = subject();
    const dom = getDOM(asyncIterator);

    dispatch('hello');
    await findByText(dom, 'hello');
    dispatch('world');
    await findByText(dom, 'world');
    dispatch();
    await findByText(dom, '');
    dispatch('goodbye');
    await findByText(dom, 'goodbye');
});

test('transform', async () => {
    const [asyncIterator, dispatch] = subject(s => s?.toUpperCase());
    const dom = getDOM(asyncIterator);

    dispatch('hello');
    await findByText(dom, 'HELLO');
    dispatch();
    await findByText(dom, '');
});

test('options.startWith', async () => {
    const [asyncIterator, dispatch] = subject({ startWith: 'hi' });
    const dom = getDOM(asyncIterator);

    await findByText(dom, 'hi');
    dispatch('hello');
    await findByText(dom, 'hello');
});

test('options.startWith skips transform', async () => {
    const [asyncIterator, dispatch] = subject(s => s?.toUpperCase(), { startWith: 'hi' });
    const dom = getDOM(asyncIterator);

    await findByText(dom, 'hi');
    dispatch('hello');
    await findByText(dom, 'HELLO');
});

test('transform replaces options.startWith if no consumer', async () => {
    const [asyncIterator, dispatch] = subject(s => s?.toUpperCase(), { startWith: 'hi' });

    dispatch('hello');
    const dom = getDOM(asyncIterator);
    await findByText(dom, 'HELLO');
});

test('options.initialValue', async () => {
    const [asyncIterator, dispatch] = subject(x => x ** 2, { initialValue: 2 });
    const dom = getDOM(asyncIterator);

    await findByText(dom, 4);
    dispatch(3);
    await findByText(dom, 9);
});

test('error both initialValue startWith, or initialValue no transformer', ({ expect }) => {
    expect(() => {
        subject(x => x ** 2, { initialValue: 2, startWith: 4 });
    }).toThrowErrorMatchingInlineSnapshot(
        `[Error: Cannot specify both initialValue and startWith option]`
    );

    expect(() => {
        subject({ initialValue: 2 });
    }).toThrowErrorMatchingInlineSnapshot(
        `[Error: Cannot specify initialValue without a transform function]`
    );
});

test.todo('options.error');


