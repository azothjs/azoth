import { describe, test, expect } from 'vitest';
import { compose } from './compose.js';
import { runCompose, elements, $text, $div } from '../test-utils/elements.test.js';

function run(value, create) {
    return runCompose(value, create).outerHTML;
}

describe('no-op values not appended', () => {

    const noValues = () => Object.entries({
        undefined: undefined,
        null: null,
        true: true,
        false: false,
        empty: '',
    });

    const getKeyList = list => list.map(([key]) => key).join(', ');

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
            "	Element(<div></div>)                <div>Hello<div></div><!--1--></div>",
            "
          ",
            "elementWithTextAnchorText",
            "	string(Text)                        <div>HelloText<!--1-->Hello</div>",
            "	number(42)                          <div>Hello42<!--1-->Hello</div>",
            "	TextNode([object Text])             <div>HelloTextNode<!--1-->Hello</div>",
            "	Element(<div></div>)                <div>Hello<div></div><!--1-->Hello</div>",
            "
          ",
            "elementWithAnchor",
            "	string(Text)                        <div>Text<!--1--></div>",
            "	number(42)                          <div>42<!--1--></div>",
            "	TextNode([object Text])             <div>TextNode<!--1--></div>",
            "	Element(<div></div>)                <div><div></div><!--1--></div>",
            "
          ",
            "elementWithAnchorText",
            "	string(Text)                        <div>Text<!--1-->Hello</div>",
            "	number(42)                          <div>42<!--1-->Hello</div>",
            "	TextNode([object Text])             <div>TextNode<!--1-->Hello</div>",
            "	Element(<div></div>)                <div><div></div><!--1-->Hello</div>",
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

    test('nested arrays', async ({ expect }) => {
        const results = elements.map(create => {
            return `${create.name.padEnd(25, ' ')} ${run([
                ['a', 'b', ['c', 'd', 'e']],
                [() => 'f', { render: () => 'g' }, function() { return 'h'; }],
            ], create)}`;
        });
        expect(results).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor     <div>Helloabcdefgh<!--8--></div>",
            "elementWithTextAnchorText <div>Helloabcdefgh<!--8-->Hello</div>",
            "elementWithAnchor         <div>abcdefgh<!--8--></div>",
            "elementWithAnchorText     <div>abcdefgh<!--8-->Hello</div>",
          ]
        `);
    });
});

describe('invalid throw', () => {
    test('object', () => {
        expect(() => {
            compose(null, { name: 'felix' });
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

