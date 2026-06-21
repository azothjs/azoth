import { describe, test, expect } from 'vitest';
import { svgElementAttributes } from 'svg-element-attributes';
import { isKnownElement } from './index.js';

/**
 * Browser validation for SVG: confirm every element svg-element-attributes
 * describes is a real SVG element (createElementNS yields an SVGElement), and
 * that dom-info treats it as a known platform element. SVG *attributes* have
 * no clean browser oracle — they're all setAttribute — so the attribute lists
 * are trusted from svg-element-attributes (spec-derived); this gates the tag
 * surface against the pinned Chromium.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const tags = Object.keys(svgElementAttributes).filter(t => t !== '*');

describe.each(tags)('svg <%s>', tag => {
    test('is a real SVG element and a known platform element', () => {
        const el = document.createElementNS(SVG_NS, tag);
        expect(el).toBeInstanceOf(SVGElement);
        expect(isKnownElement(tag)).toBe(true);
    });
});
