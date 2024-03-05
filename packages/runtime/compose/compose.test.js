import { describe, test } from 'vitest';
import { compose } from './compose.js';
import {
    elements, elementWithAnchor, elementWithText,
    $text, $div, $anchor
} from 'test-utils/elements';

export function runCompose(value, create) {
    const { dom, anchor } = create();
    compose(anchor, value);
    return dom;
}

function run(value, create) {
    return runCompose(value, create).outerHTML;
}

describe('append and remove', () => {

    test('surrounding sibling content', ({ expect }) => {
        const value = 'World';
        const results = elements.map(create => {
            return `${create.name.padEnd(28, ' ')}${run(value, create)}`;
        });

        expect(results).toMatchInlineSnapshot(`
          [
            "elementWithTextAnchor       <div>HelloWorld<!--1--></div>",
            "elementWithTextAnchorText   <div>HelloWorld<!--1-->Hello</div>",
            "elementWithAnchor           <div>World<!--1--></div>",
            "elementWithAnchorText       <div>World<!--1-->Hello</div>",
          ]
        `);
    });

    test('compose replaces prior', ({ expect }) => {
        const { dom, anchor } = elementWithAnchor();

        compose(anchor, 'first');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            first
            <!--1-->
          </div>
        `);

        compose(anchor, 'second');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            second
            <!--1-->
          </div>
        `);

        compose(anchor, ['third', 'fourth', 'fifth']);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            third
            fourth
            fifth
            <!--3-->
          </div>
        `);

        compose(anchor, 'sixth');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            sixth
            <!--1-->
          </div>
        `);

    });

    test('nested anchors', ({ expect }) => {
        const { dom, anchor: parent } = elementWithAnchor();
        const anchor = $anchor();
        compose(parent, anchor);

        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
            <!--1-->
          </div>
        `);

        compose(anchor, elementWithText().dom);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <div>
              hello
            </div>
            <!--1-->
            <!--1-->
          </div>
        `);

        const anchor2 = $anchor();
        compose(parent, anchor2);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
            <!--1-->
          </div>
        `);

        compose(anchor2, elementWithText('goodbye').dom);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <div>
              goodbye
            </div>
            <!--1-->
            <!--1-->
          </div>
        `);

    });
});

describe('values (non-async)', () => {

    function from(obj) {
        return {
            entries: Object.entries(obj),
            names: Object.keys(obj),
            values: Object.values(obj),
        };
    }

    function formatRun([name, value]) {
        return name.padEnd(15, ' ') +
            `${value}`.padEnd(15, ' ') +
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
            "undefined      undefined      <div><!--0--></div>",
            "null           null           <div><!--0--></div>",
            "true           true           <div><!--0--></div>",
            "false          false          <div><!--0--></div>",
            "empty                         <div><!--0--></div>",
          ]
        `);
    });

    test('noop still replaces', ({ expect }) => {
        const { dom, anchor } = elementWithAnchor();

        compose(anchor, 'initial');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            initial
            <!--1-->
          </div>
        `);

        compose(anchor, undefined);
        expect(dom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
          </div>
        `);
    });

    const ACCEPTED = from({
        string: 'text',
        number: 42,
        TextNode: $text('node'),
        Element: $div(),
    });

    test(ACCEPTED.names.join(), ({ expect }) => {
        const results = ACCEPTED.entries.map(formatRun);
        expect(results).toMatchInlineSnapshot(`
          [
            "string         text           <div>text<!--1--></div>",
            "number         42             <div>42<!--1--></div>",
            "TextNode       [object Text]  <div>node<!--1--></div>",
            "Element        <div></div>    <div><div></div><!--1--></div>",
          ]
        `);
    });

    test('function call composed', ({ expect }) => {
        const runFn = fn => run(fn, elementWithAnchor);
        expect(runFn($div)).toMatchInlineSnapshot(
            `"<div><div></div><!--1--></div>"`
        );
        expect(runFn(() => 'text from function')).toMatchInlineSnapshot(
            `"<div>text from function<!--1--></div>"`
        );
    });

    test('array each item', ({ expect }) => {
        const results = run(['a', 'b', 'c'], elementWithAnchor);
        expect(results).toMatchInlineSnapshot(`"<div>abc<!--3--></div>"`);
    });

    test('nested arrays with functions', async ({ expect }) => {
        const results = run([
            ['a', 'b', ['c', 'd', 'e']],
            [() => 'f', { render: () => 'g' }, function() { return 'h'; }],
        ], elementWithAnchor);

        expect(results).toMatchInlineSnapshot(`"<div>abcdefgh<!--8--></div>"`);
    });


    test('object.render', ({ expect }) => {
        const results = run({
            render() {
                return elementWithText('made with .render()').dom;
            }
        }, elementWithAnchor);
        expect(results).toMatchInlineSnapshot(
            `"<div><div>made with .render()</div><!--1--></div>"`
        );
    });

});

describe('throws on invalid types', () => {

    test('throw on invalid object', ({ expect }) => {
        expect(() => {
            compose(null, { name: 'felix' });
        }).toThrowErrorMatchingInlineSnapshot(`
      [TypeError: Invalid compose {...} input type "object", value [object Object].

      Received as:

      {
        "name": "felix"
      }

      ]
    `);
    });

    test('throw on non-render object new Class', ({ expect }) => {
        expect(() => {
            compose(null, class MyClass { });
        }).toThrowErrorMatchingInlineSnapshot(`[TypeError: Class constructor MyClass cannot be invoked without 'new']`);
    });
});