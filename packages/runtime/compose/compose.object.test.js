import { describe, test } from 'vitest';
import { compose } from './compose.js';
import { elementWithText, elementWithAnchor } from 'test-utils/elements';

export function runCompose(value, create) {
    const { dom, anchor } = create();
    compose(anchor, value);
    return dom;
}

function run(value, create) {
    return runCompose(value, create).outerHTML;
}

describe('object values', () => {

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

    test('throw on Class', ({ expect }) => {
        expect(() => {
            compose(null, class MyClass { });
        }).toThrowErrorMatchingInlineSnapshot(`[TypeError: Class constructor MyClass cannot be invoked without 'new']`);
    });

});