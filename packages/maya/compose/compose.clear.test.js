/**
 * clear() / anchor bookkeeping — EMPIRICAL PROBES.
 *
 * The anchor comment's data is `az:<count>` — the number of live nodes the
 * slot owns. clear() walks that many previousSiblings, recursing into
 * az:-prefixed comments only (nested slots tear down their own region
 * first). Both holes these probes originally confirmed are now closed:
 *
 *   1. FRAGMENT COUNT — a DocumentFragment inserts childNodes.length nodes,
 *      so replace() counts them into anchor.data (everything else counts 1).
 *      Before the fix, a compiled JSX fragment {<><p/><s/></>} in a slot —
 *      or createContextualFragment from fetched HTML — under-counted and a
 *      later clear stranded the difference.
 *
 *   2. FOREIGN COMMENT — the az: prefix is the trust boundary. An authored
 *      comment in composed content — even a numeric one like <!--9-->, which
 *      previously read as a nested-anchor count and ate content OUTSIDE the
 *      slot region — is a plain node: counted, removed, never recursed into.
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
        "<div><p>a</p><span>b</span><!--az:2--></div>",
        "<div>X<!--az:1--></div>",
      ]
    `);
});

// 1b. Same shape next to static template content — the count stays scoped
// to the slot: all three fragment children clear, "Hello" is untouched.
test('fragment children vs anchor count: with static sibling content', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithTextAnchor();   // <div>Hello<!--az:0--></div>
    const frag = document.createDocumentFragment();
    frag.append(document.createTextNode('1'), document.createTextNode('2'), document.createTextNode('3'));

    compose(anchor, frag);
    seq.push(dom.outerHTML);
    compose(anchor, 'X');
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>Hello123<!--az:3--></div>",
        "<div>HelloX<!--az:1--></div>",
      ]
    `);
});

// 2a. An authored comment with NUMERIC data composed as slot content — the
// az: guard makes it a plain node. clear removes exactly a, <!--9-->, b;
// "Hello" (static template content outside the slot) survives. Pre-guard,
// the recursion trusted the 9 as a count and ate "Hello".
test('foreign numeric comment in slot content: plain node, exact clear reach', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithTextAnchor();   // <div>Hello<!--az:0--></div>
    compose(anchor, ['a', document.createComment('9'), 'b']);
    seq.push(dom.outerHTML);
    compose(anchor, 'X');
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>Helloa<!--9-->b<!--az:3--></div>",
        "<div>HelloX<!--az:1--></div>",
      ]
    `);
});

// 2b. Control: a non-numeric authored comment (the common case) — same rule.
test('foreign text comment in slot content: plain node, exact clear reach', ({ expect }) => {
    const seq = [];
    const { dom, anchor } = elementWithTextAnchor();
    compose(anchor, ['a', document.createComment(' note '), 'b']);
    seq.push(dom.outerHTML);
    compose(anchor, 'X');
    seq.push(dom.outerHTML);
    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>Helloa<!-- note -->b<!--az:3--></div>",
        "<div>HelloX<!--az:1--></div>",
      ]
    `);
});
