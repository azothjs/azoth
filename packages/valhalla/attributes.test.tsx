/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * ATTRIBUTE TESTS
 *
 * Verifies the static-attribute vs dynamic-property split.
 *
 * - Static attributes compile to HTML in the extracted template
 * - Dynamic interpolation assigns DOM properties at runtime
 * - This means dynamic bindings need PROPERTY names, not attribute names:
 *     class= → className=  (for dynamic; class= is fine for static)
 *     for=   → htmlFor=
 *     readonly= → readOnly=
 *     tabindex= → tabIndex=
 *
 * See docs/topics/attributes-and-properties.md for the full discussion.
 */

import { describe, test } from 'vitest';

function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('dynamic class attributes', () => {

    test('class={var} does NOT work — uses attribute name not property name', ({ expect }) => {
        const Box = ({ class: className }) => (
            <div class={className}>content</div>
        );

        const el = <Box class="highlighted" />;

        // class attribute missing because element["class"] doesn't work
        expect(fixture(el)).toMatchInlineSnapshot(/* HTML */ `"<div>content</div>"`);
    });

    test('className={var} DOES work — uses DOM property name', ({ expect }) => {
        const Box = ({ className }) => (
            <div className={className}>content</div>
        );

        const el = <Box className="highlighted" />;

        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<div class="highlighted">content</div>"`
        );
    });

});
