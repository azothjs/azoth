import { describe, test } from 'vitest';
import { compose } from './compose.js';
import {
    elementWithAnchor, elementWithText,
    $text, $element, $anchor
} from 'test-utils/elements';
import { run } from './compose.test.js';

describe('values (non-async)', () => {

    function from(obj) {
        return {
            entries: Object.entries(obj),
            names: Object.keys(obj),
            values: Object.values(obj),
        };
    }

    function formatRun([name, value]) {
        return name.padEnd(13, ' ') +
            `${value}`.padEnd(18, ' ') +
            run(value, elementWithAnchor);
    }

    const NOOP = from({
        undefined: undefined,
        null: null,
        true: true,
        false: false,
        empty: '',
    });

    test(NOOP.names.join(), ({ expect }) => {
        const results = NOOP.entries.map(formatRun);

        expect(results).toMatchInlineSnapshot(`
          [
            "undefined    undefined         <div><!--az:0--></div>",
            "null         null              <div><!--az:0--></div>",
            "true         true              <div><!--az:0--></div>",
            "false        false             <div><!--az:0--></div>",
            "empty                          <div><!--az:0--></div>",
          ]
        `);
    });

    test('noop still replaces', ({ expect }) => {
        const { dom, anchor } = elementWithAnchor();

        compose(anchor, 'initial');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            initial
            <!--az:1-->
          </div>
        `);

        compose(anchor, undefined);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--az:0-->
          </div>
        `);
    });

    const ACCEPTED = from({
        string: 'text',
        number: 42,
        TextNode: $text('node'),
        CommentNode: document.createComment('node'),
        Element: $element(),
    });

    test(ACCEPTED.names.join(), ({ expect }) => {
        const results = ACCEPTED.entries.map(formatRun);
        expect(results).toMatchInlineSnapshot(`
          [
            "string       text              <div>text<!--az:1--></div>",
            "number       42                <div>42<!--az:1--></div>",
            "TextNode     [object Text]     <div>node<!--az:1--></div>",
            "CommentNode  [object Comment]  <div><!--node--><!--az:1--></div>",
            "Element      [object HTMLDivElement]<div><div></div><!--az:1--></div>",
          ]
        `);
    });

    test('function call composed', ({ expect }) => {
        const runFn = fn => run(fn, elementWithAnchor);
        expect(runFn($element)).toMatchInlineSnapshot(
            `"<div><div></div><!--az:1--></div>"`
        );
        expect(runFn(() => 'text from function')).toMatchInlineSnapshot(
            `"<div>text from function<!--az:1--></div>"`
        );
    });

    test('array each item', ({ expect }) => {
        const results = run(['a', 'b', 'c'], elementWithAnchor);
        expect(results).toMatchInlineSnapshot(`"<div>abc<!--az:3--></div>"`);
    });

    test('nested arrays with functions', async ({ expect }) => {
        const results = run([
            ['a', 'b', ['c', 'd', 'e']],
            [() => 'f', { render: () => 'g' }, function() { return 'h'; }],
        ], elementWithAnchor);

        expect(results).toMatchInlineSnapshot(`"<div>abcdefgh<!--az:8--></div>"`);
    });

    test('object.render', ({ expect }) => {
        const results = run({
            render() {
                return elementWithText('made with .render()').dom;
            }
        }, elementWithAnchor);
        expect(results).toMatchInlineSnapshot(
            `"<div><div>made with .render()</div><!--az:1--></div>"`
        );
    });
});
