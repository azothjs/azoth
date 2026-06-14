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
    test('property-less / unknown → setAttribute', () => {
        expect(resolveDynamic('data-id', 'div')).toEqual({ kind: 'attribute', name: 'data-id' });
        expect(resolveDynamic('aria-label', 'div')).toEqual({ kind: 'attribute', name: 'aria-label' });
        expect(resolveDynamic('fooBar', 'div')).toEqual({ kind: 'attribute', name: 'fooBar' });
    });
    test('force-attribute quirk → setAttribute despite a property', () => {
        expect(resolveDynamic('list', 'input')).toEqual({ kind: 'attribute', name: 'list' });
        expect(resolveDynamic('width', 'img')).toEqual({ kind: 'attribute', name: 'width' });
    });
});

describe('element questions', () => {
    test('custom element = tag with a hyphen', () => {
        expect(isCustomElement('my-element')).toBe(true);
        expect(isCustomElement('div')).toBe(false);
    });
    test('known intrinsic elements', () => {
        expect(isKnownElement('div')).toBe(true);
        expect(isKnownElement('input')).toBe(true);
        expect(isKnownElement('notarealtag')).toBe(false);
    });
});
