import { find, html, svg } from 'property-information';
import { htmlTagNames } from 'html-tag-names';
import { svgTagNames } from 'svg-tag-names';
import { mathmlTagNames } from 'mathml-tag-names';
import { htmlElementAttributes } from 'html-element-attributes';
import { svgElementAttributes } from 'svg-element-attributes';
import {
    CORRECTIONS, ATTR_ONLY, ENUMERATED, NON_STATIC, FORCE_ATTRIBUTE, NAMESPACE,
    PROPERTY_ONLY, EVENTS,
} from './data.js';

/**
 * dom-info — Azoth's DOM-API authority. thoth owns codegen; every question
 * about a prop or element comes through here, including error states.
 *
 * The model (docs/design/attributes-and-properties.md): static `="…"` →
 * markup attribute; dynamic `={…}` → the DOM API, where the real DOM property
 * is the home base and setAttribute the adjustment. `property-information`'s
 * `.property` is the React name; the REAL DOM property is
 * `CORRECTIONS[attribute] ?? info.property` (browser-validated in
 * dom-props.test.js). property-information's job here is Reactism detection:
 * when the author writes a React-only name, we error toward the platform name.
 */

const htmlElements = new Set(htmlTagNames);
const knownTags = new Set([...htmlTagNames, ...svgTagNames, ...mathmlTagNames]);
const globalAttributes = new Set(htmlElementAttributes['*']);
const svgGlobalAttributes = new Set(svgElementAttributes['*']);

const globalEvents = new Set(EVENTS.global);
const tagEvents = new Map(Object.entries(EVENTS.perTag).map(([t, ns]) => [t, new Set(ns)]));
const allEvents = new Set([...EVENTS.global, ...Object.values(EVENTS.perTag).flat()]);

// Element questions ---------------------------------------------------------

export function isCustomElement(tag) {
    return tag.includes('-');
}

// A known platform element: HTML, SVG, or MathML.
export function isKnownElement(tag) {
    return knownTags.has(tag);
}

// HTML-namespace element. Attribute resolution is HTML-only knowledge — we
// have no SVG/MathML attribute data yet — so SVG/MathML elements are not
// attribute-constrained, the same as custom elements.
function isHtmlElement(tag) {
    return htmlElements.has(tag);
}

// Prop questions ------------------------------------------------------------

const error = message => ({ kind: 'error', message });

const isEventName = rawName => rawName.length > 2 && rawName[0] === 'o' && rawName[1] === 'n';

// Events are namespace-agnostic (GlobalEventHandlers live on every element).
// camelCase is React; the name must be a real DOM event; per-tag events
// (window handlers, media EME/PiP) are element-scoped.
function resolveEvent(rawName, tagName) {
    if(/[A-Z]/.test(rawName[2])) {
        return error(`"${rawName}" is not a platform event — the DOM event property is lowercase: "${rawName.toLowerCase()}".`);
    }
    if(globalEvents.has(rawName) || tagEvents.get(tagName)?.has(rawName)) {
        return { kind: 'property', name: rawName };
    }
    if(allEvents.has(rawName)) {
        return error(`"${rawName}" is not an event on <${tagName}> — it belongs to another element.`);
    }
    return error(`"${rawName}" is not a recognized DOM event.`);
}

// The real DOM property name — the correction wins over property-information's
// React `.property`.
function realProperty(info) {
    return CORRECTIONS[info.attribute] ?? info.property;
}

function isForceAttribute(attribute, tagName) {
    const scope = FORCE_ATTRIBUTE[attribute];
    return scope === true || (scope !== undefined && scope.has(tagName));
}

// Universally-valid attribute spellings with no property to align to →
// setAttribute on any element. data-*/aria-* by prefix, plus the browser-
// verified attr-only names (microdata, element identity, …).
function isPrefixedOrAttrOnly(rawName) {
    return /^(?:data|aria)-/.test(rawName) || ATTR_ONLY.has(rawName);
}

// Is this markup attribute allowed on this element? Validates a recognized
// platform attribute against the element's attribute set (globals + the
// per-tag list). Non-HTML (SVG/MathML/custom) elements aren't constrained.
function isAttributeForTag(attribute, tagName) {
    if(!isHtmlElement(tagName)) return true;
    return globalAttributes.has(attribute)
        || (htmlElementAttributes[tagName]?.includes(attribute) ?? false);
}

// Unknown name (not a recognized platform attribute). Non-HTML elements
// (SVG/MathML/custom) define their own attributes, so they stay lenient; a
// known HTML element rejects it (strict by default — a future config flag
// may relax).
function resolveUnknown(rawName, info, tagName) {
    if(!isHtmlElement(tagName)) return { kind: 'attribute', name: info.attribute };
    return error(`"${rawName}" is not a recognized attribute or property on <${tagName}>.`);
}

// SVG resolution -------------------------------------------------------------
// SVG DOM properties are read-only SVGAnimated* wrappers (assigning a primitive
// throws or no-ops), so dynamic SVG bindings are ALWAYS setAttribute — never a
// property. Names are case-sensitive (viewBox, not viewbox) and property-
// information's `svg` schema preserves casing + carries xlink/xml namespaces.
// The author writes the markup name; a divergent property spelling errors
// toward it. Per-element attribute validation lands in Phase 3.

// Is this attribute allowed on this SVG element? svg-element-attributes gives
// per-element lists; presentation attributes (fill, stroke, …) are per-element,
// and `'*'` is only the RDFa/core globals. Elements absent from the data
// (custom elements in SVG context) aren't constrained.
function isSvgAttributeForTag(attribute, tagName) {
    const attrs = svgElementAttributes[tagName];
    if(!attrs) return true;
    return svgGlobalAttributes.has(attribute) || attrs.includes(attribute);
}

function svgChannelMismatch(rawName, info) {
    // The author writes the markup name; a divergent property spelling
    // (className for class) errors toward it. xlink/xml are handled before.
    return info.defined && rawName !== info.attribute
        ? error(`SVG uses the markup attribute name — write "${info.attribute}", not "${rawName}".`)
        : null;
}

function svgNotForTag(rawName, info, tagName) {
    return isSvgAttributeForTag(info.attribute, tagName)
        ? null
        : error(`"${rawName}" is not a valid SVG attribute on <${tagName}>.`);
}

function resolveSvgDynamic(rawName, tagName) {
    const info = find(svg, rawName);
    if(info.space === 'xlink' || info.space === 'xml') {
        return { kind: 'attributeNS', name: info.attribute, ns: NAMESPACE[info.space] };
    }
    if(isPrefixedOrAttrOnly(rawName)) return { kind: 'attribute', name: info.attribute };
    return svgChannelMismatch(rawName, info)
        ?? svgNotForTag(rawName, info, tagName)
        ?? { kind: 'attribute', name: info.attribute };
}

function resolveSvgStatic(rawName, tagName) {
    const info = find(svg, rawName);
    if(info.space === 'xlink' || info.space === 'xml' || isPrefixedOrAttrOnly(rawName)) {
        return { kind: 'attribute', name: info.attribute, boolean: !!info.boolean };
    }
    return svgChannelMismatch(rawName, info)
        ?? svgNotForTag(rawName, info, tagName)
        ?? { kind: 'attribute', name: info.attribute, boolean: !!info.boolean };
}

/**
 * Static binding (`attr="value"`) → markup.
 *   { kind: 'attribute', name, boolean } | { kind: 'promote', property }
 *   | { kind: 'error', message }
 */
export function resolveStatic(rawName, tagName, namespace = 'html') {
    if(isEventName(rawName)) {
        return error(`Event handlers are dynamic — write ${rawName}={handler}, not a static string.`);
    }
    if(namespace === 'svg') return resolveSvgStatic(rawName, tagName);
    // foreign (MathML / non-HTML islands): no attribute data — emit verbatim.
    if(namespace !== 'html') return { kind: 'attribute', name: rawName, boolean: false };

    if(NON_STATIC.has(rawName.toLowerCase())) {
        const info = find(html, rawName);
        // NON_STATIC names are element-scoped: attribute-backed ones (muted)
        // via the per-tag attribute set, property-only ones (defaultValue)
        // via PROPERTY_ONLY. Non-HTML elements aren't constrained.
        const valid = info.defined
            ? isAttributeForTag(info.attribute, tagName)
            : (PROPERTY_ONLY[rawName]?.has(tagName) ?? !isHtmlElement(tagName));
        if(!valid) return error(`"${rawName}" is not a valid attribute on <${tagName}>.`);
        return { kind: 'promote', property: realProperty(info) };
    }

    const info = find(html, rawName);
    if(info.space === 'xlink' || info.space === 'xml' || isPrefixedOrAttrOnly(rawName)) {
        return { kind: 'attribute', name: info.attribute, boolean: !!info.boolean };
    }
    if(!info.defined) {
        const unknown = resolveUnknown(rawName, info, tagName);
        return unknown.kind === 'error'
            ? unknown
            : { kind: 'attribute', name: info.attribute, boolean: false };
    }

    // Recognized platform attribute, but not allowed on this element.
    if(!isAttributeForTag(info.attribute, tagName)) {
        return error(`"${rawName}" is not a valid attribute on <${tagName}>.`);
    }

    // A property-spelled name with a static value is a channel mismatch.
    if(info.attribute !== info.property && rawName !== info.attribute) {
        return error(
            `A static value is markup — use the HTML attribute "${info.attribute}" `
            + `(or ${rawName}={…} for the dynamic DOM property).`
        );
    }

    return { kind: 'attribute', name: info.attribute, boolean: !!info.boolean };
}

/**
 * Dynamic binding (`attr={value}`) → the DOM API.
 *   { kind: 'property', name } | { kind: 'attribute', name }
 *   | { kind: 'attributeNS', name, ns } | { kind: 'error', message }
 */
export function resolveDynamic(rawName, tagName, namespace = 'html') {
    if(isEventName(rawName)) return resolveEvent(rawName, tagName);
    if(namespace === 'svg') return resolveSvgDynamic(rawName, tagName);
    // foreign (MathML / non-HTML islands): no attribute data — setAttribute,
    // honoring xlink/xml namespaces.
    if(namespace !== 'html') {
        const info = find(html, rawName);
        return (info.space === 'xlink' || info.space === 'xml')
            ? { kind: 'attributeNS', name: info.attribute, ns: NAMESPACE[info.space] }
            : { kind: 'attribute', name: rawName };
    }

    const info = find(html, rawName);

    // Namespaced (xlink:/xml:) → setAttributeNS.
    if(info.space === 'xlink' || info.space === 'xml') {
        return { kind: 'attributeNS', name: info.attribute, ns: NAMESPACE[info.space] };
    }

    // data-*/aria-* and attr-only names → setAttribute on any element.
    if(isPrefixedOrAttrOnly(rawName)) {
        return { kind: 'attribute', name: info.attribute };
    }
    // Real IDL property property-information can't see (no attribute twin),
    // scoped to its element(s): defaultValue/defaultChecked.
    if(PROPERTY_ONLY[rawName]?.has(tagName)) {
        return { kind: 'property', name: rawName };
    }
    // Unknown name → strict on known intrinsics, lenient on custom elements.
    if(!info.defined) {
        return resolveUnknown(rawName, info, tagName);
    }

    // Recognized platform attribute, but not allowed on this element.
    if(!isAttributeForTag(info.attribute, tagName)) {
        return error(`"${rawName}" is not a valid attribute on <${tagName}>.`);
    }

    // Quirks that force the attribute despite a property existing, and
    // enumerated string attributes (must not coerce through a boolean property).
    if(isForceAttribute(info.attribute, tagName) || ENUMERATED.has(info.attribute)) {
        return { kind: 'attribute', name: info.attribute };
    }

    // The dynamic channel writes the real DOM property. Anything else is a
    // mismatch — the attribute spelling, or a React-only name.
    const prop = realProperty(info);
    if(rawName === prop) {
        return { kind: 'property', name: prop };
    }
    if(rawName === info.attribute) {
        return error(`"${rawName}={…}" is a dynamic binding — use the DOM property name "${prop}" (or ${rawName}="…" for a static attribute).`);
    }
    // rawName === info.property but property-information's React name isn't the
    // real DOM property → a Reactism.
    return error(`"${rawName}" is React's name — the DOM property is "${prop}".`);
}
