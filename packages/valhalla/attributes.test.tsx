/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * ATTRIBUTE TESTS
 *
 * Verifies the static-attribute vs dynamic-property split end-to-end in a
 * real browser.
 *
 * - Static `attr="value"` compiles to HTML in the extracted template.
 * - Dynamic `attr={value}` writes through the DOM API at runtime, so the name
 *   must be the DOM property:
 *     class=    → className=   (dynamic; static class= is fine)
 *     for=      → htmlFor=
 *     readonly= → readOnly=
 *     tabindex= → tabIndex=
 *
 * Using the attribute spelling dynamically (`class={…}`) is a compile error,
 * not a silent no-op — dom-info rejects it and points at the property name
 * (see thoth's compiler/playground tests). The resolution model lives in
 * docs/design/attributes-and-properties.md.
 */

import { describe, test } from 'vitest';

function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('static attributes → template HTML', () => {

    test('static class stays a markup attribute', ({ expect }) => {
        const el = <div class="highlighted">content</div>;
        expect(fixture(el)).toMatchInlineSnapshot(`"<div class="highlighted">content</div>"`);
    });

});

describe('dynamic bindings → DOM properties', () => {

    test('className={var} sets the class property', ({ expect }) => {
        const className = 'highlighted';
        const el = <div className={className}>content</div>;
        expect(fixture(el)).toMatchInlineSnapshot(`"<div class="highlighted">content</div>"`);
    });

    test('htmlFor={var} sets the for property', ({ expect }) => {
        const htmlFor = 'name-input';
        const el = <label htmlFor={htmlFor}>Name</label>;
        expect(fixture(el)).toMatchInlineSnapshot(`"<label for="name-input">Name</label>"`);
    });

    test('data-* dynamic binding → setAttribute', ({ expect }) => {
        const id = '42';
        const el = <div data-id={id}>content</div>;
        expect(fixture(el)).toMatchInlineSnapshot(`"<div data-id="42">content</div>"`);
    });

});
