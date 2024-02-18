import { elementWithAnchor, elementWithTextAnchor, elements, runCompose } from '../test-utils/elements.test.js';
import { beforeEach, describe, test } from 'vitest';
import '../test-utils/with-resolvers-polyfill.js';
import { screen } from '@testing-library/dom';

beforeEach(context => {
    document.body.innerHTML = '';
    context.fixture = document.body;
});

describe('async', () => {

    test('Promise', async ({ expect }) => {
        const promises = [];
        const getAsyncText = (text) => {
            const promise = Promise.resolve(text);
            promises.push(promise);
            return promise;
        };

        async function testArray(value) {
            return await Promise.all(
                elements.map(async create => {
                    const promise = getAsyncText(value);
                    const dom = runCompose(promise, create);
                    await promise;
                    return `${create.name.padEnd(25, ' ')}: ${dom.outerHTML}`;
                })
            );
        }

        expect(await testArray('promise?')).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor    : <div>Hellopromise?<!--1--></div>",
            "elementWithTextAnchorText: <div>Hellopromise?<!--1-->Hello</div>",
            "elementWithAnchor        : <div>promise?<!--1--></div>",
            "elementWithAnchorText    : <div>promise?<!--1-->Hello</div>",
          ]
        `);

        expect(await testArray([42, 11, 7])).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor    : <div>Hello42117<!--3--></div>",
            "elementWithTextAnchorText: <div>Hello42117<!--3-->Hello</div>",
            "elementWithAnchor        : <div>42117<!--3--></div>",
            "elementWithAnchorText    : <div>42117<!--3-->Hello</div>",
          ]
        `);

    });

    test('array of promises', async ({ expect, fixture }) => {
        const futureLetters = [
            Promise.resolve('a'),
            Promise.resolve('b'),
            Promise.resolve('c'),
        ];

        const dom = runCompose(futureLetters, elementWithAnchor);
        fixture.append(dom);
        await screen.findByText('c', { exact: false });
        expect(dom).toMatchInlineSnapshot(`
          <div>
            a
            b
            c
            <!--3-->
          </div>
        `);
    });

    test('generators (async)', async ({ expect, fixture }) => {
        let resolve = null;
        const doAsync = async (value) => {
            const { promise, resolve: res } = Promise.withResolvers();
            resolve = () => res(value);
            return promise;
        };

        async function* numbers() {
            yield doAsync('one');
            yield doAsync('two');
            yield doAsync('three');
        }

        const numbersDom = runCompose(numbers(), elementWithTextAnchor);
        fixture.append(numbersDom);
        // initial render
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            <!--0-->
          </div>
        `);

        resolve();
        await screen.findByText('one', { exact: false });
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            one
            <!--1-->
          </div>
        `);

        resolve();
        await screen.findByText('two', { exact: false });
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            two
            <!--1-->
          </div>
        `);

        resolve();
        await screen.findByText('three', { exact: false });
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            three
            <!--1-->
          </div>
        `);

        resolve();
        await screen.findByText('three', { exact: false });
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            three
            <!--1-->
          </div>
        `);
    });
});
