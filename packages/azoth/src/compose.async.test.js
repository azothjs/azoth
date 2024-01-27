import { beforeEach, describe, test, expect, vi } from 'vitest';
import { compose } from './compose.js';
import { sleep } from './promises.js';
import './with-resolvers-polyfill.js';

const elements = [
    elementWithTextAnchor,
    elementWithTextAnchorText,
    elementWithAnchor,
    elementWithAnchorText,
];

function runCompose(value, create) {
    const { dom, anchor } = create();
    compose(value, anchor);
    return dom;
}

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

    test.only('generators (async)', async ({ expect }) => {
        let resolve = null;
        let promise = null;
        const doAsync = async (value) => {
            const { promise: p, resolve: r } = Promise.withResolvers();
            resolve = () => {
                r(value);
            };
            promise = p;
            return p;
        };

        async function* numbers() {
            yield doAsync('one');
            yield doAsync('two');
            yield doAsync('three');
        }

        const numbersDom = runCompose(numbers, elementWithTextAnchor);
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            <!--0-->
          </div>
        `);

        resolve();
        await sleep(50);
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            one
            <!--1-->
          </div>
        `);

        resolve();
        await sleep(50);
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            two
            <!--1-->
          </div>
        `);

        resolve();
        await sleep(50);
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            three
            <!--1-->
          </div>
        `);

        resolve();
        await sleep(50);
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            Hello
            three
            <!--1-->
          </div>
        `);
    });
});

describe('invalid throw', () => {
    test('object', () => {
        expect(() => {
            compose({ name: 'felix' });
        }).toThrowErrorMatchingInlineSnapshot(`
          [TypeError: Invalid {...} compose input type "object", value [object Object].

          Received as:

          {
            "name": "felix"
          }

          ]
        `);
    });
});

const $anchor = () => document.createComment('0');
const $div = () => document.createElement('div');
const $text = (text) => document.createTextNode(text);
const $helloText = () => $text('Hello');

function elementWithTextAnchor() {
    const dom = $div();
    dom.append($helloText(), $anchor());
    return { dom, anchor: dom.lastChild };
}

function elementWithTextAnchorText() {
    const dom = $div();
    dom.append($helloText(), $anchor(), $helloText());
    return { dom, anchor: dom.firstChild.nextSibling };
}

function elementWithAnchor() {
    const dom = $div();
    dom.append($anchor());
    return { dom, anchor: dom.firstChild };
}

function elementWithAnchorText() {
    const dom = $div();
    dom.append($anchor(), $helloText());
    return { dom, anchor: dom.firstChild };
}

describe('element helpers initial anchor and html', () => {

    test('text-anchor', ({ expect }) => {
        expect(elementWithTextAnchorText()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          Hello
          <!--0-->
          Hello
        </div>,
      }
    `);
    });

    test('text-anchor-text', ({ expect }) => {
        expect(elementWithTextAnchorText()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          Hello
          <!--0-->
          Hello
        </div>,
      }
    `);
    });

    test('anchor', ({ expect }) => {
        expect(elementWithAnchor()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          <!--0-->
        </div>,
      }
    `);
    });

    test('anchor-text', ({ expect }) => {
        expect(elementWithAnchorText()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          <!--0-->
          Hello
        </div>,
      }
    `);
    });
});