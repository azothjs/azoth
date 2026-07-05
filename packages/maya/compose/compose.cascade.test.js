/**
 * keepLast / append cascade — EMPIRICAL PROBES.
 *
 * Pinning what compose actually does with `keepLast` at a shared anchor, so
 * the `Input` generalization ({ initial?, from, append? }) inherits verified
 * behavior rather than a guess. The clear/accumulate mechanics here are the
 * heart of the cascade; async sources (Channel / Input) ride on top of them.
 *
 * Snapshots are generated from real output (empty → the run fills them).
 */
import { beforeEach, test } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { elementWithAnchor } from 'test-utils/elements';
import { fixtureSetup } from 'test-utils/fixtures';
import { compose } from './compose.js';
import { Channel } from '../channels/channel.js';

beforeEach(fixtureSetup);

// keepLast=false is REPLACE: does it clear the WHOLE anchor (both siblings),
// or just its own prior value? This is the mechanism behind "a live source
// clobbers its siblings" — any replacing value at a shared anchor.
test('keepLast=false after accumulating two siblings', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithAnchor();
    compose(anchor, ['A', 'B'], true);   // two accumulated siblings
    seq.push(dom.outerHTML);
    compose(anchor, 'C', false);          // replace — clears A and B too?
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>AB<!--2--></div>",
        "<div>C<!--1--></div>",
      ]
    `);
});

// keepLast=true is APPEND: adds onto whatever is already there.
test('keepLast=true appends onto existing siblings', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithAnchor();
    compose(anchor, ['A', 'B'], true);
    seq.push(dom.outerHTML);
    compose(anchor, 'C', true);
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>AB<!--2--></div>",
        "<div>ABC<!--3--></div>",
      ]
    `);
});

// An array: composeArray does `if(!keepLast) clear`, then composes each member
// with keepLast=true. So a default array should clear prior, then accumulate.
test('array clears prior content, then accumulates its members', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithAnchor();
    compose(anchor, 'X', false);
    seq.push(dom.outerHTML);
    compose(anchor, ['A', 'B', 'C']);     // default keepLast → clears X first?
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>X<!--1--></div>",
        "<div>ABC<!--3--></div>",
      ]
    `);
});

// Nested arrays at the one anchor — how does the flat sibling-count compose?
test('nested arrays flatten onto the one anchor', ({ expect }) => {
    const { dom, anchor } = elementWithAnchor();
    compose(anchor, [['A', 'B'], ['C']]);
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<div>ABC<!--3--></div>"`);
});

// A Channel = initial seed + an appending async source. `firstReplaces`: the
// seed shows, the FIRST source value replaces it (clears the seed), then
// subsequent values accumulate.
test('Channel append: seed, first value replaces it, then appends', async ({ expect, fixture, find }) => {
    const seq = [];
    let resolve;
    const step = v => {
        const { promise, resolve: r } = Promise.withResolvers();
        resolve = () => r(v);
        return promise;
    };
    async function* src() { yield step('one'); yield step('two'); }

    const { dom, anchor } = elementWithAnchor();
    fixture.append(dom);
    compose(anchor, new Channel({ source: src(), append: true }, document.createTextNode('seed')));
    seq.push(fixture.innerHTML);            // seed only
    resolve(); await find('one');
    seq.push(fixture.innerHTML);            // did 'one' replace the seed?
    resolve(); await find('onetwo');
    seq.push(fixture.innerHTML);            // did 'two' accumulate (→ onetwo)?
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>seed<!--1--></div>",
        "<div>one<!--1--></div>",
        "<div>onetwo<!--2--></div>",
      ]
    `);
});

// The shared-anchor edge: a live source next to a static sibling. Its first
// value goes through the replace path (clear-whole-anchor), so the static
// sibling is clobbered. This is why independent live regions want a frame
// (KeyedList), not an array.
test('live source in an array clobbers a static sibling', async ({ expect, fixture, find }) => {
    const seq = [];
    let resolve;
    const step = v => {
        const { promise, resolve: r } = Promise.withResolvers();
        resolve = () => r(v);
        return promise;
    };
    async function* src() { yield step('live'); }

    const { dom, anchor } = elementWithAnchor();
    fixture.append(dom);
    compose(anchor, ['static', new Channel({ source: src(), append: true }, document.createTextNode('seed'))]);
    seq.push(fixture.innerHTML);            // static + seed
    resolve(); await find('live');
    seq.push(fixture.innerHTML);            // did 'static' survive?
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>staticseed<!--2--></div>",
        "<div>live<!--1--></div>",
      ]
    `);
});
