import { describe, test } from 'vitest';
import { htmlTagNames } from 'html-tag-names';
import { htmlElementAttributes } from 'html-element-attributes';
import { html, find } from 'property-information';
import { ariaAttributes } from 'aria-attributes';
import { ATTR_ONLY, CORRECTIONS, ENUMERATED } from './data.js';
import { isCustomElement, isKnownElement } from './index.js';

/**
 * dom-info's empirical validation — the source of truth for the DOM facts in
 * data.js. Runs in a real browser (chromium): for every element/attribute,
 * confirm the property `CORRECTIONS[attr] ?? property-information.property`
 * actually exists on a created element. This is what makes CORRECTIONS
 * trustworthy — property-information's `.property` is the React name, and the
 * corrections are where the platform diverges. Bumping property-information
 * re-runs this gate.
 */

// can be created, but no props exist
const removedElements = { applet: true, basefont: true, isindex: true };

const tags = htmlTagNames.filter(tag => !removedElements[tag]);
const tagsWithAttrs = tags.filter(tag => htmlElementAttributes[tag]);
const globalAttrs = htmlElementAttributes['*'];

describe.each(tagsWithAttrs)('%s', tag => {
    const el = document.createElement(tag);

    describe.each(htmlElementAttributes[tag])(`%s`, attr => {
        const info = find(html, attr);

        test('property info found', ({ expect }) => {
            expect(info.defined).toBe(true);
        });

        const tableChar = ['char', 'charoff'];
        const removed = {
            thead: tableChar, tr: tableChar, th: tableChar, td: tableChar,
            tbody: tableChar, tfoot: tableChar, col: tableChar, colgroup: tableChar,
            form: ['accept'],
            area: ['type', 'hreflang'],
            head: ['profile'],
            html: ['manifest'],
            img: ['hspace', 'vspace'],
            input: ['ismap'],
            object: ['hspace', 'vspace', 'typemustmatch', 'classid'],
            details: ['name'],
            iframe: ['allowusermedia'],
            link: ['color'],
            template: ['shadowrootdelegatesfocus'],
        };
        const notYetImplemented = {
            button: ['popovertargetaction', 'popovertarget', 'commandfor'],
            input: ['popovertargetaction', 'popovertarget', 'alpha', 'colorspace'],
            iframe: ['loading', 'allowpaymentrequest', 'fetchpriority'],
            script: ['fetchpriority', 'blocking'],
            link: ['blocking', 'fetchpriority'],
            style: ['blocking'],
            img: ['fetchpriority'],
            video: ['playsinline'],
        };
        const attrOnly = {
            template: ['shadowrootmode'],
            script: ['language'],
            link: ['imagesrcset'],
            meta: ['charset'],
            track: ['srclang'],
        };

        test(info.property, ({ expect }) => {
            if(removed[tag]?.includes(attr)) return;
            if(attrOnly[tag]?.includes(attr)) return;
            if(notYetImplemented[tag]?.includes(attr)) return;
            const prop = el[CORRECTIONS[attr] || info.property];
            expect(prop).not.toBe(undefined);
        });
    });
});

describe.each(tags)('%s', tag => {
    const el = document.createElement(tag);

    test('create + known element', ({ expect }) => {
        expect(el).toBeDefined();
        expect(isKnownElement(tag)).toBe(true);
        expect(isCustomElement(tag)).toBe(false);
    });

    describe.each(globalAttrs)(`global %s`, attr => {
        const info = find(html, attr);

        test(info.property, ({ expect }) => {
            // azoth resolves these to setAttribute, so don't validate a prop.
            if(ATTR_ONLY.has(attr) || ENUMERATED.has(attr)) return;
            const prop = el[CORRECTIONS[attr] || info.property];
            expect(prop).not.toBe(undefined);
        });
    });

    describe.each(ariaAttributes)(`aria %s`, attr => {
        const info = find(html, attr);

        const removed = { 'aria-dropeffect': true };
        const attrOnly = {
            'aria-activedescendant': true, 'aria-controls': true,
            'aria-describedby': true, 'aria-details': true,
            'aria-errormessage': true, 'aria-flowto': true,
            'aria-grabbed': true, 'aria-labelledby': true, 'aria-owns': true,
        };

        test(info.property, ({ expect }) => {
            if(removed[attr] || attrOnly[attr]) return;
            const prop = el[CORRECTIONS[attr] || info.property];
            expect(prop).not.toBe(undefined);
        });
    });
});

describe('custom elements', () => {
    test('a hyphenated tag is a custom element, not a known intrinsic', ({ expect }) => {
        expect(isCustomElement('my-element')).toBe(true);
        expect(isKnownElement('my-element')).toBe(false);
    });
});
