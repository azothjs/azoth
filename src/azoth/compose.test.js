// @vitest-environment jsdom
import { beforeEach, describe, test, expect } from 'vitest';
import { compose } from './compose.js';

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

function run(value, create) {
    return runCompose(value, create).outerHTML;
}

const getKeyList = list => list.map(([key]) => key).join(', ');

describe('no-op values not appended', () => {

    const noValues = () => Object.entries({
        undefined: undefined,
        null: null,
        true: true,
        false: false,
        empty: '',
    });

    test(getKeyList(noValues()), () => {
        const results = elements.flatMap(create => {
            return [
                `${create.name}`,
                ...noValues().map(([type, value], i) => {
                    return `\t${`${type}(${value})`.padEnd(35, ' ')} ${run(value, create)}`;
                }),
                '\n'
            ];
        });

        expect(results).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor",
            "	undefined(undefined)                <div>Hello<!--0--></div>",
            "	null(null)                          <div>Hello<!--0--></div>",
            "	true(true)                          <div>Hello<!--0--></div>",
            "	false(false)                        <div>Hello<!--0--></div>",
            "	empty()                             <div>Hello<!--0--></div>",
            "
          ",
            "elementWithTextAnchorText",
            "	undefined(undefined)                <div>Hello<!--0-->Hello</div>",
            "	null(null)                          <div>Hello<!--0-->Hello</div>",
            "	true(true)                          <div>Hello<!--0-->Hello</div>",
            "	false(false)                        <div>Hello<!--0-->Hello</div>",
            "	empty()                             <div>Hello<!--0-->Hello</div>",
            "
          ",
            "elementWithAnchor",
            "	undefined(undefined)                <div><!--0--></div>",
            "	null(null)                          <div><!--0--></div>",
            "	true(true)                          <div><!--0--></div>",
            "	false(false)                        <div><!--0--></div>",
            "	empty()                             <div><!--0--></div>",
            "
          ",
            "elementWithAnchorText",
            "	undefined(undefined)                <div><!--0-->Hello</div>",
            "	null(null)                          <div><!--0-->Hello</div>",
            "	true(true)                          <div><!--0-->Hello</div>",
            "	false(false)                        <div><!--0-->Hello</div>",
            "	empty()                             <div><!--0-->Hello</div>",
            "
          ",
          ]
        `);
    });
});
  
describe(`accepted values appended`, () => {

    const accepted = () => Object.entries({
        string: 'Text',
        number: 42,
        TextNode: $text('TextNode'),
        Element: $div(),
    });
    
    test('string, number, TextNode, Element', () => {
        const results = elements.flatMap(create => {
            return [
                `${create.name}`,
                ...accepted().map(([type, value], i) => {
                    return `\t${`${type}(${value})`.padEnd(35, ' ')} ${run(value, create)}`;
                }),
                '\n'
            ];
        });

        expect(results).toMatchInlineSnapshot(`
      [
        "elementWithTextAnchor",
        "	string(Text)                        <div>HelloText<!--1--></div>",
        "	number(42)                          <div>Hello42<!--1--></div>",
        "	TextNode([object Text])             <div>HelloTextNode<!--1--></div>",
        "	Element([object HTMLDivElement])    <div>Hello<div></div><!--1--></div>",
        "
      ",
        "elementWithTextAnchorText",
        "	string(Text)                        <div>HelloText<!--1-->Hello</div>",
        "	number(42)                          <div>Hello42<!--1-->Hello</div>",
        "	TextNode([object Text])             <div>HelloTextNode<!--1-->Hello</div>",
        "	Element([object HTMLDivElement])    <div>Hello<div></div><!--1-->Hello</div>",
        "
      ",
        "elementWithAnchor",
        "	string(Text)                        <div>Text<!--1--></div>",
        "	number(42)                          <div>42<!--1--></div>",
        "	TextNode([object Text])             <div>TextNode<!--1--></div>",
        "	Element([object HTMLDivElement])    <div><div></div><!--1--></div>",
        "
      ",
        "elementWithAnchorText",
        "	string(Text)                        <div>Text<!--1-->Hello</div>",
        "	number(42)                          <div>42<!--1-->Hello</div>",
        "	TextNode([object Text])             <div>TextNode<!--1-->Hello</div>",
        "	Element([object HTMLDivElement])    <div><div></div><!--1-->Hello</div>",
        "
      ",
      ]
    `);
    });

});

describe('function called, result appended', () => {

    test('return value composed', ({ expect }) => {

        function testFunction(fn) {
            return elements.map(create => {
                return `${create.name.padEnd(25, ' ')}: ${run(fn, create)}`;
            });
        }

        expect(testFunction($div)).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor    : <div>Hello<div></div><!--1--></div>",
            "elementWithTextAnchorText: <div>Hello<div></div><!--1-->Hello</div>",
            "elementWithAnchor        : <div><div></div><!--1--></div>",
            "elementWithAnchorText    : <div><div></div><!--1-->Hello</div>",
          ]
        `);

        expect(testFunction(() => 'function')).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor    : <div>Hellofunction<!--1--></div>",
            "elementWithTextAnchorText: <div>Hellofunction<!--1-->Hello</div>",
            "elementWithAnchor        : <div>function<!--1--></div>",
            "elementWithAnchorText    : <div>function<!--1-->Hello</div>",
          ]
        `);

    });
});

describe('array appended', () => {
    test('each child item', ({ expect }) => {
        const results = elements.map(create => {
            return `${create.name.padEnd(25, ' ')} ${run(['a', 'b', 'c'], create)}`;
        });
        expect(results).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor     <div>Helloabc<!--3--></div>",
            "elementWithTextAnchorText <div>Helloabc<!--3-->Hello</div>",
            "elementWithAnchor         <div>abc<!--3--></div>",
            "elementWithAnchorText     <div>abc<!--3-->Hello</div>",
          ]
        `);
    });
});

describe('async resolved appended', () => {

    test('promise', async ({ expect }) => {
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

const $anchor = () => document.createComment(0);
const $div = () => document.createElement('div');
const $text = (text) => document.createTextNode(text);
const $helloText = () =>$text('Hello');

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