import { describe, test, expect } from 'vitest';
import { resolveStatic, resolveDynamic } from './dom-attributes.js';

// The resolution table — see docs/design/attributes-and-properties.md.
// Static = HTML markup attribute; dynamic = the DOM API (property home base,
// setAttribute the adjustment). Strict: channel mismatches are errors.

describe('resolveStatic — markup attributes', () => {
    test('attribute spelling → template attribute', () => {
        expect(resolveStatic('class', 'div')).toEqual({ kind: 'attribute', name: 'class', boolean: false });
        expect(resolveStatic('for', 'label')).toEqual({ kind: 'attribute', name: 'for', boolean: false });
        expect(resolveStatic('id', 'div')).toEqual({ kind: 'attribute', name: 'id', boolean: false });
    });

    test('boolean attribute flagged', () => {
        expect(resolveStatic('disabled', 'button')).toEqual({ kind: 'attribute', name: 'disabled', boolean: true });
    });

    test('data-/aria-/custom → template attribute, name verbatim', () => {
        expect(resolveStatic('data-id', 'div')).toEqual({ kind: 'attribute', name: 'data-id', boolean: false });
        expect(resolveStatic('aria-label', 'div')).toEqual({ kind: 'attribute', name: 'aria-label', boolean: false });
    });

    test('property spelling with a static value → error (use the attribute)', () => {
        expect(resolveStatic('className', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveStatic('className', 'div').message).toMatch(/use the HTML attribute "class"/);
        expect(resolveStatic('htmlFor', 'label')).toMatchObject({ kind: 'error' });
    });

    test('NON_STATIC → promote to a dynamic property', () => {
        expect(resolveStatic('autofocus', 'input')).toMatchObject({ kind: 'promote' });
        expect(resolveStatic('muted', 'video')).toMatchObject({ kind: 'promote' });
    });
});

describe('resolveDynamic — the DOM API', () => {
    test('property spelling → property (home base)', () => {
        expect(resolveDynamic('className', 'div')).toEqual({ kind: 'property', name: 'className' });
        expect(resolveDynamic('htmlFor', 'label')).toEqual({ kind: 'property', name: 'htmlFor' });
        expect(resolveDynamic('value', 'input')).toEqual({ kind: 'property', name: 'value' });
        expect(resolveDynamic('checked', 'input')).toEqual({ kind: 'property', name: 'checked' });
        expect(resolveDynamic('id', 'div')).toEqual({ kind: 'property', name: 'id' });
    });

    test('attribute spelling of a divergent name → error (use the property)', () => {
        expect(resolveDynamic('class', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveDynamic('class', 'div').message).toMatch(/use the property name "className"/);
        expect(resolveDynamic('for', 'label')).toMatchObject({ kind: 'error' });
    });

    test('events: lowercase on* → property; camelCase → error', () => {
        expect(resolveDynamic('onclick', 'button')).toEqual({ kind: 'property', name: 'onclick' });
        expect(resolveDynamic('onClick', 'button')).toMatchObject({ kind: 'error' });
        expect(resolveDynamic('onClick', 'button').message).toMatch(/lowercase — use "onclick"/);
    });

    test('enumerated → setAttribute (string, not boolean/property)', () => {
        expect(resolveDynamic('spellcheck', 'div')).toEqual({ kind: 'attribute', name: 'spellcheck' });
        expect(resolveDynamic('draggable', 'div')).toEqual({ kind: 'attribute', name: 'draggable' });
    });

    test('property-less → setAttribute', () => {
        expect(resolveDynamic('data-id', 'div')).toEqual({ kind: 'attribute', name: 'data-id' });
        expect(resolveDynamic('aria-label', 'div')).toEqual({ kind: 'attribute', name: 'aria-label' });
        expect(resolveDynamic('fooBar', 'div')).toEqual({ kind: 'attribute', name: 'fooBar' }); // unknown
        expect(resolveDynamic('viewBox', 'svg')).toEqual({ kind: 'attribute', name: 'viewBox' }); // SVG, case kept
    });

    test('force-attribute quirk → setAttribute despite a property', () => {
        expect(resolveDynamic('list', 'input')).toEqual({ kind: 'attribute', name: 'list' });
        expect(resolveDynamic('width', 'img')).toEqual({ kind: 'attribute', name: 'width' });
    });
});
