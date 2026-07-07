/**
 * Async source teardown — the reentrancy guard, made visible.
 *
 * compose cancels a live source when its anchor is cleared (a content swap, or
 * a plain value taking over). The subtlety the guard handles: a source
 * composing its OWN value takes the replace path → clear(), and that clear must
 * NOT cancel the source. `currentSource` distinguishes a self-update from an
 * outside takeover. (The nested case — an outer source driving inner Inputs —
 * is the swap test in compose.input.test.js.)
 *
 * Snapshots are generated from real output.
 */
import { beforeEach, test } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { elementWithAnchor } from 'test-utils/elements';
import { fixtureSetup } from 'test-utils/fixtures';
import { compose } from './compose.js';

beforeEach(fixtureSetup);

// A hand-driven async source: push(v) emits v; push(DONE) ends it.
const DONE = Symbol('done');
function driven() {
    const queue = [];
    let waiting = null;
    const gen = (async function* () {
        for(;;) {
            let v;
            if(queue.length) v = queue.shift();
            else {
                const { promise, resolve } = Promise.withResolvers();
                waiting = resolve;
                v = await promise;
            }
            if(v === DONE) return;
            yield v;
        }
    })();
    const push = v => {
        if(waiting) { const w = waiting; waiting = null; w(v); }
        else queue.push(v);
    };
    return { gen, push };
}

// SELF-UPDATE. A source that keeps replacing its own value (default keep=false)
// must not be torn down by its own updates: each value clears the last, but
// that clear is self-triggered (currentSource === this source), so the guard
// skips it and the source flows on. Without the guard, v1's clear would cancel
// the source and v2 would never arrive (this test would hang).
test('a source replacing its own value is not self-cancelled', async ({ expect, fixture, find }) => {
    const seq = [];
    const s = driven();
    const { dom, anchor } = elementWithAnchor();
    fixture.append(dom);
    compose(anchor, s.gen);

    s.push('v1'); await find('v1'); seq.push(fixture.innerHTML);
    s.push('v2'); await find('v2'); seq.push(fixture.innerHTML);
    s.push('v3'); await find('v3'); seq.push(fixture.innerHTML);

    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>v1<!--az:1--></div>",
        "<div>v2<!--az:1--></div>",
        "<div>v3<!--az:1--></div>",
      ]
    `);
});

// TAKEOVER. A plain value replacing a live source clears the anchor from
// OUTSIDE the source (currentSource is null, not this source), so the guard
// lets the clear cancel: the source is torn down and a later push is ignored —
// no intrusion on the value that replaced it.
test('a plain value replacing a live source tears the source down', async ({ expect, fixture, find }) => {
    const seq = [];
    const s = driven();
    const { dom, anchor } = elementWithAnchor();
    fixture.append(dom);
    compose(anchor, s.gen);

    s.push('v1'); await find('v1'); seq.push(fixture.innerHTML);
    compose(anchor, 'static'); await find('static'); seq.push(fixture.innerHTML);
    s.push('v2');                                     // ignored — source torn down
    await new Promise(resolve => setTimeout(resolve));
    seq.push(fixture.innerHTML);                      // still 'static'

    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>v1<!--az:1--></div>",
        "<div>static<!--az:1--></div>",
        "<div>static<!--az:1--></div>",
      ]
    `);
});
