import { describe, test, expect } from 'vitest';
import {
    resolveStatic, resolveDynamic, isCustomElement, isKnownElement,
} from './index.js';

// dom-info answers thoth's prop/element questions. See
// docs/design/attributes-and-properties.md. The DOM property names are
// browser-validated (CORRECTIONS over property-information's React names);
// the property-information dep is here for Reactism error detection.

describe('resolveStatic — markup attributes', () => {
    test('attribute spelling → template attribute', () => {
        expect(resolveStatic('class', 'div')).toEqual({ kind: 'attribute', name: 'class', boolean: false });
        expect(resolveStatic('id', 'div')).toEqual({ kind: 'attribute', name: 'id', boolean: false });
    });
    test('boolean attribute flagged', () => {
        expect(resolveStatic('disabled', 'button')).toEqual({ kind: 'attribute', name: 'disabled', boolean: true });
    });
    test('data-/aria- → verbatim attribute', () => {
        expect(resolveStatic('data-id', 'div')).toEqual({ kind: 'attribute', name: 'data-id', boolean: false });
        expect(resolveStatic('aria-label', 'div')).toEqual({ kind: 'attribute', name: 'aria-label', boolean: false });
    });
    test('property spelling, static value → error', () => {
        expect(resolveStatic('className', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveStatic('className', 'div').message).toMatch(/use the HTML attribute "class"/);
    });
    test('NON_STATIC → promote to a dynamic property', () => {
        expect(resolveStatic('autofocus', 'input')).toMatchObject({ kind: 'promote' });
        expect(resolveStatic('muted', 'video')).toMatchObject({ kind: 'promote' });
    });
    test('NON_STATIC promotion is per-tag — muted is media-only', () => {
        expect(resolveStatic('muted', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveStatic('muted', 'div').message).toMatch(/not a valid attribute on <div>/);
        expect(resolveStatic('autofocus', 'div')).toMatchObject({ kind: 'promote' }); // global
    });
    test('static event handler → error', () => {
        expect(resolveStatic('onclick', 'button')).toMatchObject({ kind: 'error' });
    });
});

describe('resolveDynamic — the DOM API', () => {
    test('real DOM property → property', () => {
        expect(resolveDynamic('className', 'div')).toEqual({ kind: 'property', name: 'className' });
        expect(resolveDynamic('htmlFor', 'label')).toEqual({ kind: 'property', name: 'htmlFor' });
        expect(resolveDynamic('value', 'input')).toEqual({ kind: 'property', name: 'value' });
        expect(resolveDynamic('id', 'div')).toEqual({ kind: 'property', name: 'id' });
    });
    test('srcset: the platform property is lowercase, React`s srcSet errors', () => {
        expect(resolveDynamic('srcset', 'img')).toEqual({ kind: 'property', name: 'srcset' });
        expect(resolveDynamic('srcSet', 'img')).toMatchObject({ kind: 'error' });
        expect(resolveDynamic('srcSet', 'img').message).toMatch(/React's name — the DOM property is "srcset"/);
    });
    test('autocomplete: platform is lowercase, React`s autoComplete errors', () => {
        expect(resolveDynamic('autocomplete', 'input')).toEqual({ kind: 'property', name: 'autocomplete' });
        expect(resolveDynamic('autoComplete', 'input')).toMatchObject({ kind: 'error' });
    });
    test('attribute spelling of a divergent name → error (use the property)', () => {
        expect(resolveDynamic('class', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveDynamic('class', 'div').message).toMatch(/use the DOM property name "className"/);
    });
    test('events: lowercase → property; camelCase → error', () => {
        expect(resolveDynamic('onclick', 'button')).toEqual({ kind: 'property', name: 'onclick' });
        expect(resolveDynamic('onClick', 'button')).toMatchObject({ kind: 'error' });
    });
    test('enumerated → setAttribute', () => {
        expect(resolveDynamic('spellcheck', 'div')).toEqual({ kind: 'attribute', name: 'spellcheck' });
        expect(resolveDynamic('draggable', 'div')).toEqual({ kind: 'attribute', name: 'draggable' });
    });
    test('data-*/aria-* → setAttribute', () => {
        expect(resolveDynamic('data-id', 'div')).toEqual({ kind: 'attribute', name: 'data-id' });
        expect(resolveDynamic('aria-label', 'div')).toEqual({ kind: 'attribute', name: 'aria-label' });
    });
    test('force-attribute quirk → setAttribute despite a property', () => {
        expect(resolveDynamic('list', 'input')).toEqual({ kind: 'attribute', name: 'list' });
        expect(resolveDynamic('width', 'img')).toEqual({ kind: 'attribute', name: 'width' });
    });
});

describe('per-tag validity', () => {
    test('a recognized attribute on the wrong element → error', () => {
        expect(resolveDynamic('href', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveDynamic('href', 'div').message).toMatch(/not a valid attribute on <div>/);
        expect(resolveDynamic('value', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveStatic('href', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveStatic('value', 'p')).toMatchObject({ kind: 'error' });
    });
    test('the same attribute on its element resolves', () => {
        expect(resolveDynamic('href', 'a')).toEqual({ kind: 'property', name: 'href' });
        expect(resolveDynamic('value', 'input')).toEqual({ kind: 'property', name: 'value' });
        expect(resolveStatic('href', 'a')).toEqual({ kind: 'attribute', name: 'href', boolean: false });
    });
    test('global attributes are valid on any element', () => {
        expect(resolveDynamic('id', 'span')).toEqual({ kind: 'property', name: 'id' });
        expect(resolveDynamic('className', 'section')).toEqual({ kind: 'property', name: 'className' });
        expect(resolveStatic('class', 'section')).toEqual({ kind: 'attribute', name: 'class', boolean: false });
    });
    test('custom/unknown elements are not constrained', () => {
        expect(resolveDynamic('href', 'my-widget')).toEqual({ kind: 'property', name: 'href' });
        expect(resolveStatic('href', 'my-widget')).toEqual({ kind: 'attribute', name: 'href', boolean: false });
    });
});

describe('unrecognized names — strict on intrinsics, lenient on custom', () => {
    test('unknown name on a known intrinsic → error', () => {
        expect(resolveDynamic('fooBar', 'div')).toMatchObject({ kind: 'error' });
        expect(resolveDynamic('fooBar', 'div').message).toMatch(/not a recognized attribute or property on <div>/);
        expect(resolveStatic('foo-bar', 'div')).toMatchObject({ kind: 'error' });
    });
    test('unknown name on a custom element → setAttribute (author-defined)', () => {
        expect(resolveDynamic('fooBar', 'my-widget')).toEqual({ kind: 'attribute', name: 'fooBar' });
        expect(resolveStatic('foo-bar', 'my-widget')).toEqual({ kind: 'attribute', name: 'foo-bar', boolean: false });
    });
});

describe('element questions', () => {
    test('custom element = tag with a hyphen', () => {
        expect(isCustomElement('my-element')).toBe(true);
        expect(isCustomElement('div')).toBe(false);
    });
    test('known elements span HTML, SVG, and MathML', () => {
        expect(isKnownElement('div')).toBe(true);
        expect(isKnownElement('input')).toBe(true);
        expect(isKnownElement('path')).toBe(true);   // svg
        expect(isKnownElement('circle')).toBe(true); // svg
        expect(isKnownElement('math')).toBe(true);   // mathml
        expect(isKnownElement('notarealtag')).toBe(false);
    });
    test('SVG/MathML attributes are not constrained (no HTML data)', () => {
        // We validate the tag, but have no SVG/MathML attribute data, so
        // attributes route leniently rather than erroring.
        expect(resolveDynamic('cx', 'circle')).toEqual({ kind: 'attribute', name: 'cx' });
        expect(resolveStatic('d', 'path')).toEqual({ kind: 'attribute', name: 'd', boolean: false });
    });
});
