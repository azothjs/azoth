import { find, html } from 'property-information';

/**
 * The DOM-attribute resolution table — azoth as the DOM-API authority.
 *
 * See docs/design/attributes-and-properties.md. The model:
 *   - static `attr="value"`  → HTML markup attribute.
 *   - dynamic `attr={value}` → the DOM API; a property is the home base,
 *     setAttribute / setAttributeNS the adjustments for property-less names.
 * The author picks the channel by SYNTAX; the name must fit it.
 *
 * `property-information` (wooorm) is the source of what it knows — the
 * attribute↔property reflection map, boolean flags, defined-ness, namespace.
 * Azoth OWNS the decisions (strict, the channel/error logic) and the DOM-API
 * quirks property-information doesn't carry (below).
 */

// Azoth-owned: enumerated attributes whose value is the literal string
// "true"/"false". A boolean property/presence would mis-coerce (`"false"`
// → truthy), so they're plain string attributes. (property-information's
// `booleanish` is broader and false-positives `value`, so we keep our own.)
const ENUMERATED = new Set(['spellcheck', 'draggable', 'translate', 'autocorrect']);

// Azoth-owned: cannot be serialized into a cloned template even when static —
// must be applied as a JS property. A static value on these is promoted to a
// dynamic property assignment.
const NON_STATIC = new Set(['autofocus', 'muted', 'defaultvalue', 'defaultchecked']);

// Azoth-owned: the property exists but is read-only / has side effects, so a
// dynamic binding must use setAttribute. Tag-scoped (Vue's force-attribute
// traps). `true` = any element.
const FORCE_ATTRIBUTE = {
    form: true,
    list: new Set(['input']),
    type: new Set(['textarea']),
    width: new Set(['img', 'video', 'canvas', 'source']),
    height: new Set(['img', 'video', 'canvas', 'source']),
    sandbox: new Set(['iframe']),
};

const NAMESPACE = {
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace',
};

function isForceAttribute(attribute, tagName) {
    const scope = FORCE_ATTRIBUTE[attribute];
    if(!scope) return false;
    return scope === true || scope.has(tagName);
}

function error(message) {
    return { kind: 'error', message };
}

/**
 * Static binding (`attr="value"`) → HTML markup. Returns:
 *   { kind: 'attribute', name, boolean }  — emit into the template
 *   { kind: 'promote',  property }         — can't be static; apply as a property
 *   { kind: 'error', message }
 */
export function resolveStatic(rawName, tagName) {
    if(NON_STATIC.has(rawName.toLowerCase())) {
        const info = find(html, rawName);
        return { kind: 'promote', property: info.property };
    }

    const info = find(html, rawName);
    const divergent = info.attribute !== info.property;

    // A property-spelled name with a static value is a channel mismatch:
    // markup uses the attribute spelling.
    if(divergent && rawName === info.property) {
        return error(
            `"${rawName}=…" is a static value, which is markup — use the HTML `
            + `attribute "${info.attribute}" (or ${rawName}={…} to set the `
            + `"${rawName}" DOM property dynamically).`
        );
    }

    return { kind: 'attribute', name: info.attribute, boolean: !!info.boolean };
}

/**
 * Dynamic binding (`attr={value}`) → the DOM API. Returns:
 *   { kind: 'property',    name }       — node[name] = value
 *   { kind: 'attribute',   name }       — setAttribute(name, value)
 *   { kind: 'attributeNS', name, ns }   — setAttributeNS(ns, name, value)
 *   { kind: 'error', message }
 */
export function resolveDynamic(rawName, tagName) {
    // Events: the on* property channel; camelCase is React, not the platform.
    if(rawName.length > 2 && rawName[0] === 'o' && rawName[1] === 'n') {
        if(/[A-Z]/.test(rawName[2])) {
            return error(
                `"${rawName}" is not a platform event. The DOM event property is `
                + `lowercase — use "${rawName.toLowerCase()}".`
            );
        }
        return { kind: 'property', name: rawName };
    }

    const info = find(html, rawName);

    // Namespaced (xlink:/xml:) → setAttributeNS.
    if(info.space === 'xlink' || info.space === 'xml') {
        return { kind: 'attributeNS', name: info.attribute, ns: NAMESPACE[info.space] };
    }

    // Property-less: data-*/aria-* platform extensions, custom/unknown names,
    // SVG presentation attrs (undefined in the html schema). setAttribute —
    // these have no property to align to, so the divergent-spelling check
    // below does not apply (`data-id`'s `dataId` property is not the channel).
    if(/^(?:data|aria)-/.test(rawName) || !info.defined) {
        return { kind: 'attribute', name: info.attribute };
    }

    // Quirks that force the attribute despite a property existing, plus
    // enumerated attrs (string "true"/"false", which must not coerce through a
    // boolean property). These win over the divergent-spelling check below —
    // e.g. `spellcheck`↔`spellCheck`: either spelling is a string attribute.
    if(isForceAttribute(info.attribute, tagName) || ENUMERATED.has(info.attribute)) {
        return { kind: 'attribute', name: info.attribute };
    }

    // An attribute-spelled name with a dynamic value is a channel mismatch:
    // the JS layer uses the property spelling.
    if(info.attribute !== info.property && rawName === info.attribute) {
        return error(
            `"${rawName}={…}" is a dynamic binding, which is a DOM property — use `
            + `the property name "${info.property}" (or ${rawName}="…" for a `
            + `static HTML attribute).`
        );
    }

    // Default: the DOM property is the home base.
    return { kind: 'property', name: info.property };
}
