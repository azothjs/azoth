/**
 * Validated DOM facts + azoth-owned DOM-API quirks.
 *
 * `property-information` carries the attribute↔name map and flags, but its
 * `.property` is the React/hast name, which is NOT always the real DOM
 * property (e.g. it says `srcSet`/`autoComplete`; the platform is `srcset`/
 * `autocomplete`). dom-info's browser validation (dom-props.test.js) probes
 * the actual element to find the truth. The two blocks below are that
 * validated truth, lifted to module level so the validator AND the resolve
 * interface share one source.
 */

// CORRECTIONS: attribute name → the REAL DOM property name, for the cases
// where property-information's React `.property` diverges from the platform.
// Browser-verified. Where an attribute is absent here, the real property is
// property-information's `.property` (validated to exist).
export const CORRECTIONS = {
    allowfullscreen: 'allowFullscreen',
    autocapitalize: 'autocapitalize',
    autocomplete: 'autocomplete',
    autofocus: 'autofocus',
    autoplay: 'autoplay',
    charset: 'charset',
    enctype: 'enctype',
    formenctype: 'formEnctype',
    hreflang: 'hreflang',
    imagesrcset: 'imagesrcset',
    spellcheck: 'spellcheck',
    srcdoc: 'srcdoc',
    srcset: 'srcset',
};

// ATTR_ONLY: names with no usable DOM property → setAttribute. Browser-
// verified attr-only set (microdata, element identity, a few element-specific
// names). `data-*` and `aria-*` are handled by prefix in resolve; the explicit
// `aria-*` entries below are the ones that lack a reflected property.
export const ATTR_ONLY = new Set([
    'is', 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype', 'exportparts',
    'language',                                   // script
    'srclang',                                    // track
    'shadowrootmode', 'shadowrootdelegatesfocus', // template
    'aria-activedescendant', 'aria-controls', 'aria-describedby', 'aria-details',
    'aria-errormessage', 'aria-flowto', 'aria-grabbed', 'aria-labelledby', 'aria-owns',
]);

/* --- azoth-owned, well-known DOM-API quirks (candidates for dom-info's own
   validation later; for now they are stated, not probed) --- */

// Enumerated attributes whose value is the literal string "true"/"false". A
// boolean property/presence would mis-coerce, so they're string attributes.
export const ENUMERATED = new Set(['spellcheck', 'draggable', 'translate', 'autocorrect']);

// Cannot be serialized into a cloned template even when static — a static
// value is promoted to a dynamic property assignment.
export const NON_STATIC = new Set(['autofocus', 'muted', 'defaultvalue', 'defaultchecked']);

// Real IDL properties with no content-attribute twin, so property-information
// (attribute-keyed) can't see them: defaultValue/defaultChecked reflect the
// `value`/`checked` *attributes* (the initial value), distinct from the live
// `value`/`checked` properties. Scoped to the elements that own them;
// browser-validated in dom-props.test.js.
export const PROPERTY_ONLY = {
    defaultValue: new Set(['input', 'textarea']),
    defaultChecked: new Set(['input']),
};

// The property exists but is read-only / side-effecting, so a dynamic binding
// must use setAttribute. Tag-scoped; `true` = any element.
export const FORCE_ATTRIBUTE = {
    form: true,
    list: new Set(['input']),
    type: new Set(['textarea']),
    width: new Set(['img', 'video', 'canvas', 'source']),
    height: new Set(['img', 'video', 'canvas', 'source']),
    sandbox: new Set(['iframe']),
};

export const NAMESPACE = {
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace',
};

// Standard events a headless desktop browser doesn't expose: touch handlers
// appear only with touch support ('ontouchstart' in window is the classic
// feature-detect). Listed explicitly so they validate, and excluded from the
// strict browser-match in events.test.js.
export const CONDITIONAL_EVENTS = [
    'ontouchcancel', 'ontouchend', 'ontouchmove', 'ontouchstart',
];

// Platform event surface, derived from the browser (property-information's
// event data is incomplete — it misses pointer/touch/animation/etc.).
// `global` = on* handlers present on every element (GlobalEventHandlers +
// DocumentAndElementEventHandlers, plus CONDITIONAL_EVENTS); `perTag` =
// element-specific extras (media EME/PiP, the window handlers reflected on
// body/frameset). Browser-validated and regenerated in events.test.js.
export const EVENTS = {
    global: CONDITIONAL_EVENTS.concat(`
        onabort onanimationcancel onanimationend onanimationiteration onanimationstart
        onauxclick onbeforecopy onbeforecut onbeforeinput onbeforematch onbeforepaste
        onbeforetoggle onbeforexrselect onblur oncancel oncanplay oncanplaythrough
        onchange onclick onclose oncommand oncontentvisibilityautostatechange oncontextlost
        oncontextmenu oncontextrestored oncopy oncuechange oncut ondblclick ondrag ondragend
        ondragenter ondragleave ondragover ondragstart ondrop ondurationchange onemptied
        onended onerror onfocus onformdata onfullscreenchange onfullscreenerror
        ongotpointercapture oninput oninvalid onkeydown onkeypress onkeyup onload
        onloadeddata onloadedmetadata onloadstart onlostpointercapture onmousedown
        onmouseenter onmouseleave onmousemove onmouseout onmouseover onmouseup onmousewheel
        onpaste onpause onplay onplaying onpointercancel onpointerdown onpointerenter
        onpointerleave onpointermove onpointerout onpointerover onpointerrawupdate onpointerup
        onprogress onratechange onreset onresize onscroll onscrollend onscrollsnapchange
        onscrollsnapchanging onsearch onsecuritypolicyviolation onseeked onseeking onselect
        onselectionchange onselectstart onslotchange onstalled onsubmit onsuspend ontimeupdate
        ontoggle ontransitioncancel ontransitionend ontransitionrun ontransitionstart
        onvolumechange onwaiting onwebkitanimationend onwebkitanimationiteration
        onwebkitanimationstart onwebkitfullscreenchange onwebkitfullscreenerror
        onwebkittransitionend onwheel
    `.split(/\s+/).filter(Boolean)),
    perTag: {
        audio: ['onencrypted', 'onwaitingforkey'],
        video: ['onencrypted', 'onenterpictureinpicture', 'onleavepictureinpicture', 'onwaitingforkey'],
        body: WINDOW_EVENTS(),
        frameset: WINDOW_EVENTS(),
    },
};

// Window event handlers, reflected on body/frameset (WindowEventHandlers).
function WINDOW_EVENTS() {
    return [
        'onafterprint', 'onbeforeprint', 'onbeforeunload', 'ongamepadconnected',
        'ongamepaddisconnected', 'onhashchange', 'onlanguagechange', 'onmessage',
        'onmessageerror', 'onoffline', 'ononline', 'onpagehide', 'onpageshow',
        'onpopstate', 'onrejectionhandled', 'onstorage', 'onunhandledrejection', 'onunload',
    ];
}
