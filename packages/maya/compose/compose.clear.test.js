/**
 * clear() / anchor bookkeeping — EMPIRICAL PROBES.
 *
 * The anchor comment's data is the count of live nodes the slot owns;
 * clear() walks that many previousSiblings, recursing into comment nodes
 * (nested slots tear down their own region first). Two probed holes:
 *
 *   1. FRAGMENT COUNT — FIXED (probe-driven). A DocumentFragment inserts
 *      childNodes.length nodes, so replace() counts them into anchor.data
 *      (everything else counts 1). Before the fix, a compiled JSX fragment
 *      {<><p/><s/></>} in a slot — or createContextualFragment from fetched
 *      HTML — under-counted and a later clear stranded the difference.
 *
 *   2. FOREIGN NUMERIC COMMENT — OPEN HOLE, pinned below as current
 *      behavior. clear()'s recursion treats ANY comment as a nested anchor;
 *      a user comment with numeric data (<!--9-->) composed as slot content
 *      claims 9 preceding nodes it doesn't own and eats content outside the
 *      slot region. Text comments (<!-- note -->) are safe: +data is NaN,
 *      the recursion no-ops. Guard design TBD (mint-time anchor registry vs
 *      data prefix vs documented limitation).
 *
 * Snapshots are generated from real output (empty → the run fills them).
 */
import { test } from 'vitest';
import { elementWithAnchor, elementWithTextAnchor } from 'test-utils/elements';
import { compose } from './compose.js';

// 1a. Multi-child fragment, then replace: anchor counts BOTH children, so
// both clear. (Pre-fix: data said 1, replace stranded <p>a</p>.)
test('fragment children vs anchor count: replace after multi-child fragment', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithAnchor();
    const frag = document.createDocumentFragment();
    const p = document.createElement('p');
    p.textContent = 'a';
    const span = document.createElement('span');
    span.textContent = 'b';
    frag.append(p, span);

    compose(anchor, frag);          // inserts 2 nodes — data counts 2
    seq.push(dom.outerHTML);
    compose(anchor, 'X');           // replace — BOTH p and span go
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div><p>a</p><span>b</span><!--2--></div>",
        "<div>X<!--1--></div>",
      ]
    `);
});

// 1b. Same shape next to static template content — the count stays scoped
// to the slot: all three fragment children clear, "Hello" is untouched.
test('fragment children vs anchor count: with static sibling content', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithTextAnchor();   // <div>Hello<!--0--></div>
    const frag = document.createDocumentFragment();
    frag.append(document.createTextNode('1'), document.createTextNode('2'), document.createTextNode('3'));

    compose(anchor, frag);
    seq.push(dom.outerHTML);
    compose(anchor, 'X');
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>Hello123<!--3--></div>",
        "<div>HelloX<!--1--></div>",
      ]
    `);
});

// 2a. THE OPEN HOLE, pinned as current behavior — this snapshot is WRONG on
// purpose and should break when a guard lands. A user comment with NUMERIC
// data composed as slot content: clear's recursion claims 9 preceding nodes
// and eats "Hello", the static template content OUTSIDE the slot. Correct
// output would keep "Hello": `<div>HelloX<!--1--></div>`.
test('foreign numeric comment in slot content: clear over-reaches (pinned hole)', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithTextAnchor();   // <div>Hello<!--0--></div>
    compose(anchor, ['a', document.createComment('9'), 'b']);
    seq.push(dom.outerHTML);
    compose(anchor, 'X');           // should remove exactly a, <!--9-->, b
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>Helloa<!--9-->b<!--3--></div>",
        "<div>X<!--1--></div>",
      ]
    `);
});

// 2b. Control: a non-numeric user comment (the common case — <!-- note -->).
test('foreign text comment in slot content: clear reach', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithTextAnchor();
    compose(anchor, ['a', document.createComment(' note '), 'b']);
    seq.push(dom.outerHTML);
    compose(anchor, 'X');
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>Helloa<!-- note -->b<!--3--></div>",
        "<div>HelloX<!--1--></div>",
      ]
    `);
});
