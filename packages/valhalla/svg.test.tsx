/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * SVG TESTS
 *
 * SVG flows through the same compile-to-template-clone pipeline as HTML. Two
 * things make it work end-to-end:
 *
 * - The browser's foreign-content parsing namespaces the cloned template for
 *   free — <svg> and its children come out in the SVG namespace, <div> inside
 *   <foreignObject> flips back to HTML.
 * - dom-info resolves SVG attributes to setAttribute (SVG DOM properties are
 *   read-only SVGAnimated*), case-preserved (viewBox, not viewbox), with
 *   xlink:/xml: via setAttributeNS.
 */

import { describe, test } from 'vitest';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('static SVG', () => {

    test('namespaces and serializes, case preserved', ({ expect }) => {
        const el = <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg> as Element;
        expect((el as Element).namespaceURI).toBe(SVG_NS);
        expect(el.querySelector('circle')!.namespaceURI).toBe(SVG_NS);
        expect(el.getAttribute('viewBox')).toBe('0 0 24 24'); // not lowercased
        expect(fixture(el)).toMatchInlineSnapshot(`"<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>"`);
    });

});

describe('dynamic SVG attributes → setAttribute', () => {

    test('geometry + presentation bindings apply, case preserved', ({ expect }) => {
        const cx = 12, r = 10, fill = 'rebeccapurple', box = '0 0 24 24';
        const el = <svg viewBox={box}><circle cx={cx} cy={cx} r={r} fill={fill}/></svg> as Element;
        const circle = el.querySelector('circle')!;
        expect(el.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(circle.getAttribute('cx')).toBe('12');
        expect(circle.getAttribute('r')).toBe('10');
        expect(circle.getAttribute('fill')).toBe('rebeccapurple');
        expect(fixture(el)).toMatchInlineSnapshot(`"<svg viewBox="0 0 24 24"><circle data-bind="" cx="12" cy="12" r="10" fill="rebeccapurple"></circle></svg>"`);
    });

    test('xlink:href → setAttributeNS', ({ expect }) => {
        const href = '#icon';
        const el = <svg><use xlink:href={href}/></svg> as Element;
        const use = el.querySelector('use')!;
        expect(use.getAttributeNS(XLINK_NS, 'href')).toBe('#icon');
    });

});

describe('a realistic icon', () => {

    test('viewBox + path with dynamic class and fill', ({ expect }) => {
        const cls = 'icon icon-check', color = 'currentColor';
        const el = (
            <svg viewBox="0 0 24 24" class={cls} width="24" height="24"><path d="M20 6L9 17l-5-5" fill={color}/></svg>
        ) as Element;
        const path = el.querySelector('path')!;
        expect(el.namespaceURI).toBe(SVG_NS);
        expect(el.getAttribute('class')).toBe('icon icon-check');
        expect(el.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(path.getAttribute('d')).toBe('M20 6L9 17l-5-5');
        expect(path.getAttribute('fill')).toBe('currentColor');
    });

});

describe('foreignObject — HTML island inside SVG', () => {

    test('html children flip back to the HTML namespace and use properties', ({ expect }) => {
        const cls = 'card';
        const el = <svg><foreignObject><div className={cls}>hi</div></foreignObject></svg> as Element;
        const div = el.querySelector('div')!;
        expect(div.namespaceURI).toBe(XHTML_NS);
        expect(div.className).toBe('card'); // HTML property, not setAttribute
        expect(div.getAttribute('class')).toBe('card');
    });

});
