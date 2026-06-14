import { find, html } from 'property-information';
import { htmlTagNames } from 'html-tag-names';
import {
    CORRECTIONS, ATTR_ONLY, ENUMERATED, NON_STATIC, FORCE_ATTRIBUTE, NAMESPACE,
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

const knownTags = new Set(htmlTagNames);

// Element questions ---------------------------------------------------------

export function isCustomElement(tag) {
    return tag.includes('-');
}

export function isKnownElement(tag) {
    return knownTags.has(tag);
}

// Prop questions ------------------------------------------------------------

const error = message => ({ kind: 'error', message });

// The real DOM property name — the correction wins over property-information's
// React `.property`.
function realProperty(info) {
    return CORRECTIONS[info.attribute] ?? info.property;
}

function isForceAttribute(attribute, tagName) {
    const scope = FORCE_ATTRIBUTE[attribute];
    return scope === true || (scope !== undefined && scope.has(tagName));
}

function isPropertyLess(rawName, info) {
    return /^(?:data|aria)-/.test(rawName) || ATTR_ONLY.has(rawName) || !info.defined;
}

/**
 * Static binding (`attr="value"`) → HTML markup.
 *   { kind: 'attribute', name, boolean } | { kind: 'promote', property }
 *   | { kind: 'error', message }
 */
export function resolveStatic(rawName, tagName) {
    if(rawName.length > 2 && rawName[0] === 'o' && rawName[1] === 'n') {
        return error(`Event handlers are dynamic — write ${rawName}={handler}, not a static string.`);
    }
    if(NON_STATIC.has(rawName.toLowerCase())) {
        return { kind: 'promote', property: realProperty(find(html, rawName)) };
    }

    const info = find(html, rawName);
    if(info.space === 'xlink' || info.space === 'xml' || isPropertyLess(rawName, info)) {
        return { kind: 'attribute', name: info.attribute, boolean: !!info.boolean };
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
export function resolveDynamic(rawName, tagName) {
    // Events: the on* property channel; camelCase is React, not the platform.
    if(rawName.length > 2 && rawName[0] === 'o' && rawName[1] === 'n') {
        if(/[A-Z]/.test(rawName[2])) {
            return error(`"${rawName}" is not a platform event — the DOM event property is lowercase: "${rawName.toLowerCase()}".`);
        }
        return { kind: 'property', name: rawName };
    }

    const info = find(html, rawName);

    // Namespaced (xlink:/xml:) → setAttributeNS.
    if(info.space === 'xlink' || info.space === 'xml') {
        return { kind: 'attributeNS', name: info.attribute, ns: NAMESPACE[info.space] };
    }

    // Property-less (data-*/aria-*, custom/unknown, attr-only) → setAttribute.
    // No property to align to, so no divergent/Reactism check applies.
    if(isPropertyLess(rawName, info)) {
        return { kind: 'attribute', name: info.attribute };
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
