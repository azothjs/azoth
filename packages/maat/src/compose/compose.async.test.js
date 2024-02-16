import { elementWithTextAnchor, elements, runCompose } from '../test-utils/elements.test.js';
import { describe, test } from 'vitest';
import '../test-utils/with-resolvers-polyfill.js';

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

    test('generators (async)', async ({ expect }) => {
        let tickTock = null;
        const doAsync = async (value) => {
            const { promise, resolve } = Promise.withResolvers();
            // it takes two event loops for the value to get through
            tickTock = async () => {
                resolve(value);
                // this is the async activity the generator is waiting on
                await promise.then((value) => {
                    // wait for the async generator to yield 
                    // the value asynchronously itself!
                    return Promise.resolve();
                });
            };
            return promise;
        };

        async function* numbers() {
            yield doAsync('one');
            yield doAsync('two');
            yield doAsync('three');
        }

        const numbersDom = runCompose(numbers, elementWithTextAnchor);
        // initial render
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            <!--0-->
          </div>
        `);

        await tickTock();
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            one
            <!--1-->
          </div>
        `);

        await tickTock();
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            two
            <!--1-->
          </div>
        `);

        await tickTock();
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            three
            <!--1-->
          </div>
        `);

        await tickTock();
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            three
            <!--1-->
          </div>
        `);
    });
});
