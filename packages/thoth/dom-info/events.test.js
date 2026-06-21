import { describe, test, expect } from 'vitest';
import { htmlTagNames } from 'html-tag-names';
import { EVENTS, CONDITIONAL_EVENTS } from './data.js';

/**
 * Browser validation for the event surface in data.js. property-information's
 * event data is incomplete, so the EVENTS sets are derived from the browser
 * (the authority) and pinned in data.js. This test confirms they still match
 * the live Chromium build — a bump that adds/removes an on* handler fails here
 * and the sets are regenerated.
 */

// on* handler properties anywhere on an element's prototype chain.
function onProps(el) {
    const set = new Set();
    for(let o = el; o; o = Object.getPrototypeOf(o)) {
        for(const k of Object.getOwnPropertyNames(o)) {
            if(k.length > 2 && k[0] === 'o' && k[1] === 'n') set.add(k);
        }
    }
    return set;
}

const liveGlobal = onProps(document.createElement('div'));

test('global events match the browser (modulo capability-gated)', () => {
    // The browser must expose nothing we don't list (catches new handlers).
    for(const e of liveGlobal) expect(EVENTS.global).toContain(e);
    // Anything we list the browser lacks must be a known conditional event
    // (touch) — catches stale entries without rejecting real touch handlers.
    const extra = EVENTS.global.filter(e => !liveGlobal.has(e)).sort();
    expect(extra).toEqual([...CONDITIONAL_EVENTS].sort());
});

describe('per-tag event extras match the browser', () => {
    // Every element's on* set, minus globals, must equal data.js's perTag entry
    // (or be empty when there's no entry).
    test.each(htmlTagNames)('%s', tag => {
        const extras = [...onProps(document.createElement(tag))]
            .filter(e => !liveGlobal.has(e)).sort();
        const expected = (EVENTS.perTag[tag] ?? []).slice().sort();
        expect(extras).toEqual(expected);
    });
});
