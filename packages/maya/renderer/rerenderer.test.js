import { describe, test, beforeAll } from 'vitest';
import { compose, composeComponent, createComponent } from '../compose/compose.js';
import { Channel } from '../channels/channel.js';
import { render, RenderService } from './render.js';
import { renderer, rerenderer } from './rerenderer.js';

/**
 * Increment (a) of the Rerenderer spike — runtime only, intrinsic only.
 * Templates are hand-built render(...) calls (what thoth emits), per
 * the pattern in controller.test.js. See docs/design/rerenderer.md.
 */

beforeAll(() => RenderService.useDOMEngine());

// <p data-bind><!--az:0--></p> with one child slot — the standard test shape.
const slotTargets = r => [r.childNodes[0]];
const slotBind = targets => {
    const t0 = targets[0];
    return v0 => compose(t0, v0);
};
const makeP = id => render(id, slotTargets, slotBind, false, `<p data-bind><!--az:0--></p>`);

describe('rerenderer — the gate', () => {

    test('non-function throws (the expression form evaluated too early)', ({ expect }) => {
        expect(() => rerenderer('nope')).toThrow(/requires a function/);
        expect(() => rerenderer(document.createElement('div')))
            .toThrow(/requires a function/);
        expect(() => rerenderer(undefined)).toThrow(/requires a function/);
    });

});

describe('renderer — the reset (fresh shadow)', () => {

    // renderer() pushes a fresh Renderer: it ignores siteKey and builds anew.
    // Topping the stack, it SHADOWS an outer rerenderer, so a nested render
    // site mints new DOM instead of being reused. (A custom-element frame
    // pushes one in connectedCallback — see docs/design/keyed-list.md.)

    test('non-function throws, like rerenderer', ({ expect }) => {
        expect(() => renderer('nope')).toThrow(/requires a function/);
    });

    test('a wrapped site builds fresh inside an outer rerenderer — not reused', ({ expect }) => {
        const t = makeP('reset-fresh');
        const fn = rerenderer(v => renderer(() => t(v))());

        const a = fn('x');
        const b = fn('y');              // outer re-runs; renderer() shadows it

        expect(b).not.toBe(a);          // fresh node, not the cached one
        expect(a.textContent).toBe('x');
        expect(b.textContent).toBe('y');
    });

    test('without the reset, the same site is reused by the outer rerenderer', ({ expect }) => {
        const t = makeP('reset-contrast');
        const fn = rerenderer(v => t(v));

        const a = fn('x');
        const b = fn('y');              // same site, cached → same node, rebound

        expect(b).toBe(a);              // reused — the behavior the reset overrides
        expect(b.textContent).toBe('y');
    });

});

describe('rerenderer — same nodes, new values', () => {

    test('re-execution rebinds the same DOM', ({ expect }) => {
        const t = makeP('rr-basic');
        const fn = rerenderer(name => t(name));

        const n1 = fn('felix');
        expect(n1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">felix<!--az:1--></p>"`);

        const n2 = fn('duchess');
        expect(n2).toBe(n1); // same node — new props, same DOM
        expect(n1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">duchess<!--az:1--></p>"`);
    });

    test('the thunk parameters are the update surface', ({ expect }) => {
        const t = makeP('rr-params');
        let frozen = 'setup';
        // `frozen` is closure-captured: the setup surface. `name` flows.
        const fn = rerenderer(name => t(`${frozen}:${name}`));

        const node = fn('a');
        expect(node.textContent).toBe('setup:a');
        frozen = 'changed'; // a let re-assignment DOES flow (live binding) —
        fn('b');            // the convention is about props, not JS scoping
        expect(node.textContent).toBe('changed:b');
    });

});

describe('rerenderer — control flow (the hooks coin, flipped)', () => {

    test('conditional branches: each cached by its own site; sleeping, not dead', ({ expect }) => {
        // anchor comment is childNodes[1] here — text "A:" is [0]
        const prefixTargets = r => [r.childNodes[1]];
        const tA = render('rr-br-a', prefixTargets, slotBind, false, `<p data-bind>A:<!--az:0--></p>`);
        const tB = render('rr-br-b', prefixTargets, slotBind, false, `<p data-bind>B:<!--az:0--></p>`);
        const fn = rerenderer((flag, v) => flag ? tA(v) : tB(v));

        const a1 = fn(true, 'x');
        const b1 = fn(false, 'y');
        expect(b1).not.toBe(a1);
        expect(a1.textContent).toBe('A:x');
        expect(b1.textContent).toBe('B:y');

        // Flip back: branch A was sleeping (count 0 — retained, not pruned).
        const a2 = fn(true, 'z');
        expect(a2).toBe(a1); // resurrected, same node
        expect(a1.textContent).toBe('A:z');
    });

    test('loops: ordinal reuse — primary site, secondary occurrence; lists shrink', ({ expect }) => {
        const t = makeP('rr-items');
        const fn = rerenderer(items => items.map(x => t(x)));

        const r1 = fn(['a', 'b', 'c']);
        expect(r1.map(n => n.textContent)).toEqual(['a', 'b', 'c']);

        // Shrink: positions 0,1 reused in order; tail pruned.
        const r2 = fn(['x', 'y']);
        expect(r2[0]).toBe(r1[0]);
        expect(r2[1]).toBe(r1[1]);
        expect(r2.map(n => n.textContent)).toEqual(['x', 'y']);

        // Regrow: 0,1 still the same nodes; 2 is NEW — the old tail was
        // pruned (lists shrink), unlike the sleeping branch above.
        const r3 = fn(['1', '2', '3']);
        expect(r3[0]).toBe(r1[0]);
        expect(r3[1]).toBe(r1[1]);
        expect(r3[2]).not.toBe(r1[2]);
        expect(r3.map(n => n.textContent)).toEqual(['1', '2', '3']);
    });

    test('deduped templates cannot collide: per-declaration site identity', ({ expect }) => {
        // Two declarations, SAME template id — the compiled shape after
        // per-site factory emission. Closure identity keys the cache.
        const html = `<p data-bind><!--az:0--></p>`;
        const tX = render('rr-dup', slotTargets, slotBind, false, html);
        const tY = render('rr-dup', slotTargets, slotBind, false, html);
        const fn = rerenderer((a, b) => [tX(a), tY(b)]);

        const [x1, y1] = fn('left', 'right');
        expect(y1).not.toBe(x1);
        expect(x1.textContent).toBe('left');
        expect(y1.textContent).toBe('right');

        const [x2, y2] = fn('L', 'R');
        expect(x2).toBe(x1);
        expect(y2).toBe(y1);
        expect(x1.textContent).toBe('L');
        expect(y1.textContent).toBe('R');
    });

});

describe('rerenderer — anchor memory (=== skip)', () => {

    test('identical value at a slot is one instruction, not two', ({ expect }) => {
        const t = makeP('rr-skip');
        let calls = 0;
        const widget = {
            render() {
                calls++;
                return document.createTextNode('w');
            }
        };
        const fn = rerenderer(w => t(w));

        fn(widget);
        expect(calls).toBe(1);

        fn(widget);            // same ref — skipped, not re-rendered
        expect(calls).toBe(1);

        const widget2 = {
            render() {
                calls += 10;
                return document.createTextNode('w2');
            }
        };
        fn(widget2);           // new ref — full replace
        expect(calls).toBe(11);
    });

    test('accumulate path (keep) is exempt: repeated values are legitimate', ({ expect }) => {
        const t = makeP('rr-arr');
        const fn = rerenderer(pair => t(pair));
        // An array composes per-item with keep=true — two identical
        // strings must BOTH render (no false skip on the append path).
        const node = fn(['a', 'a']);
        expect(node.textContent).toBe('aa');
    });

});

describe('rerenderer — components inside the wrap (increment c)', () => {

    // Simulates the compiled component slot: bind receives the tuple
    // [Constructor, props] and calls composeComponent (what __composeComponent does).
    const componentBind = targets => {
        const t0 = targets[0];
        return v0 => composeComponent(t0, v0);
    };
    const makeHost = id =>
        render(id, slotTargets, componentBind, false, `<p data-bind><!--az:0--></p>`);

    test('chain rule: setup runs once, the returned rerenderable is re-invoked', ({ expect }) => {
        const tCard = makeP('rr-c-card');
        let setupCount = 0;

        function CatCard({ id }) {
            setupCount++; // the setup zone — must run ONCE
            const renderFn = rerenderer(props => tCard(`cat #${props.id}`));
            return renderFn;
        }

        const host = makeHost('rr-c-host');
        const page = rerenderer(catId => host([CatCard, { id: catId }]));

        const dom = page(1);
        const card = dom.firstChild;
        expect(setupCount).toBe(1);
        expect(card.textContent).toBe('cat #1');

        page(2);
        expect(setupCount).toBe(1);              // setup protected
        expect(dom.firstChild).toBe(card);        // same DOM
        expect(card.textContent).toBe('cat #2');  // new props flowed
    });

    test('plain function component: re-called (setup re-fires), DOM still stable via site cache', ({ expect }) => {
        const tCard = makeP('rr-c-plain');
        let setupCount = 0;

        const Cat = ({ name }) => {
            setupCount++; // re-fires per pass — the documented re-call cost
            return tCard(name);
        };

        const host = makeHost('rr-c-plainhost');
        const page = rerenderer(name => host([Cat, { name }]));

        const dom = page('felix');
        const card = dom.firstChild;
        expect(setupCount).toBe(1);
        expect(card.textContent).toBe('felix');

        page('duchess');
        expect(setupCount).toBe(2);               // body re-ran
        expect(dom.firstChild).toBe(card);         // but DOM is stable —
        expect(card.textContent).toBe('duchess');  // Cat's template site cached
    });

    test('different Constructor at the same anchor: teardown and recreate', ({ expect }) => {
        const tA = makeP('rr-c-swapa');
        const tB = makeP('rr-c-swapb');
        const A = ({ v }) => tA(`A:${v}`);
        const B = ({ v }) => tB(`B:${v}`);

        const host = makeHost('rr-c-swaphost');
        const page = rerenderer((C, v) => host([C, { v }]));

        const dom = page(A, 1);
        const first = dom.firstChild;
        expect(first.textContent).toBe('A:1');

        page(B, 2);
        const second = dom.firstChild;
        expect(second).not.toBe(first);
        expect(second.textContent).toBe('B:2');

        // And back: A's template site was sleeping — node resurrects,
        // but the component memo correctly re-walks the chain.
        page(A, 3);
        expect(dom.firstChild).toBe(first);
        expect(first.textContent).toBe('A:3');
    });

    test('nested components: chains stay stable through two host levels', ({ expect }) => {
        const tCard = makeP('rr-nest-card');
        let pageSetup = 0, cardSetup = 0;

        // Inner component: setup once, returns its rerenderable.
        function Card({ label }) {
            cardSetup++;
            return rerenderer(props => tCard(`card:${props.label}`));
        }

        // Outer component: hosts Card, itself returns a rerenderable.
        // Two composeComponent levels nest, each with its own anchor memo.
        function Page({ label }) {
            pageSetup++;
            const cardHost = makeHost('rr-nest-cardhost');
            return rerenderer(props => cardHost([Card, { label: props.label }]));
        }

        const pageHost = makeHost('rr-nest-pagehost');
        const app = rerenderer(label => pageHost([Page, { label }]));

        const dom = app('felix');
        const card = dom.firstChild.firstChild; // pageHost > Page-host > card
        expect(pageSetup).toBe(1);
        expect(cardSetup).toBe(1);
        expect(card.textContent).toBe('card:felix');

        app('duchess');
        expect(pageSetup).toBe(1);                     // outer setup protected
        expect(cardSetup).toBe(1);                     // inner setup protected too
        expect(dom.firstChild.firstChild).toBe(card);  // deepest node stable
        expect(card.textContent).toBe('card:duchess'); // props flowed through both
    });

});

describe('create() narrowing — component position eats clean', () => {

    test('array as component throws', ({ expect }) => {
        const Wha = [1, 2, 3, 4];
        expect(() => createComponent(Wha, { length: 0 }))
            .toThrow(/Invalid compose/);
    });

    test('Promise as component throws (lazy = async function)', ({ expect }) => {
        expect(() => createComponent(Promise.resolve('nope')))
            .toThrow(/Invalid compose/);
    });

    test('boolean as component throws; null/undefined are no-ops', ({ expect }) => {
        expect(() => createComponent(false)).toThrow(/Cannot use boolean/);
        expect(() => createComponent(true)).toThrow(/Cannot use boolean/);
        expect(createComponent(null)).toBe(null);
        expect(createComponent(undefined)).toBe(null);
    });

});

describe('rerenderer — nesting', () => {

    test('inner rerenderer is stable inside an outer pass', ({ expect }) => {
        const tIn = makeP('rr-inner');
        const tOut = makeP('rr-outer');

        const inner = rerenderer(v => tIn(v));
        const outer = rerenderer(v => tOut(inner(v)));

        const o1 = outer('felix');
        const innerNode = o1.firstChild;
        expect(innerNode.textContent).toBe('felix');

        const o2 = outer('duchess');
        expect(o2).toBe(o1);
        // Inner returned the same node; the outer slot === skipped it —
        // the node never moved, only its slot value rebound.
        expect(o1.firstChild).toBe(innerNode);
        expect(innerNode.textContent).toBe('duchess');
    });

});

describe('rerenderer — UIComponent protocol (increment d)', () => {

    const componentBind = targets => {
        const t0 = targets[0];
        return v0 => composeComponent(t0, v0);
    };
    const makeHost = id =>
        render(id, slotTargets, componentBind, false, `<p data-bind><!--az:0--></p>`);

    // Transpiled JSX emits one factory declaration per call site (increment
    // b). Site identity is the factory's CLOSURE identity (fresh per
    // render() call), so a render() and an update() that each contain <X/>
    // are distinct sites even with identical HTML — they can't share a node
    // the way two calls to one factory would. (That same-HTML-still-distinct
    // path is proven by the "deduped templates cannot collide" test above;
    // these tests don't re-exercise it.)
    //
    // NOTE: the separate-sites test below stands in for two call sites by
    // giving them DIFFERENT template ids — a structural shortcut. At runtime
    // the separation would come from the closure mechanism, not the id.

    // Pattern: update() re-renders through render()'s OWN site
    // (this.render()) — one site, so the node is reused across updates.
    test('class: constructed once, update re-renders through this.render() — node stable', ({ expect }) => {
        const tCard = makeP('rr-d-cls');
        let ctor = 0, render = 0, update = 0;
        class Cat {
            constructor({ id }) { ctor++; this.id = id; }
            render() { render++; return tCard(`cat #${this.id}`); }
            update({ id }) { update++; this.id = id; return this.render(); }
        }
        const host = makeHost('rr-d-clshost');
        const page = rerenderer(id => host([Cat, { id }]));

        const dom = page(1);
        const node = dom.firstChild;
        expect(ctor).toBe(1);
        expect(render).toBe(1);
        expect(node.textContent).toBe('cat #1');

        page(2);
        expect(ctor).toBe(1);               // constructed ONCE — the point of (d)
        expect(update).toBe(1);             // update verb fired
        expect(render).toBe(2);             // re-rendered via render()'s site (cheap)
        expect(dom.firstChild).toBe(node);  // same node — shared site + === skip
        expect(node.textContent).toBe('cat #2');
    });

    // Pattern: render() and update() carry SEPARATE JSX (distinct sites).
    // The first update renders from its own site → a new node replaces
    // render's; subsequent updates reuse the update site → then stable.
    test('object literal: separate render/update sites — first update swaps node, then stable', ({ expect }) => {
        const tRender = makeP('rr-d-lit-r');
        const tUpdate = makeP('rr-d-lit-u');
        let init = 0;
        const card = {
            initialize({ id }) { init++; this.id = id; },
            render() { return tRender(`cat #${this.id}`); },          // site R
            update({ id }) { this.id = id; return tUpdate(`cat #${this.id}`); }, // site U
        };
        const host = makeHost('rr-d-lithost');
        const page = rerenderer(id => host([card, { id }]));

        const dom = page(1);
        const first = dom.firstChild;
        expect(init).toBe(1);
        expect(first.textContent).toBe('cat #1');

        page(2);
        expect(init).toBe(1);                       // intake once — not re-initialized
        const second = dom.firstChild;
        expect(second).not.toBe(first);             // update's site is a different node
        expect(second.textContent).toBe('cat #2');

        page(3);
        expect(dom.firstChild).toBe(second);        // update site now hits — stable
        expect(second.textContent).toBe('cat #3');
    });

    test('update returning void: component handled its own DOM internally', ({ expect }) => {
        let render = 0, update = 0;
        const widget = {
            initialize({ label }) { this.label = label; },
            render() { render++; this.node = document.createTextNode(this.label); return this.node; },
            update({ label }) { update++; this.node.data = label; }, // returns void
        };
        const host = makeHost('rr-d-void');
        const page = rerenderer(label => host([widget, { label }]));

        const dom = page('a');
        const node = dom.firstChild;
        expect(render).toBe(1);
        expect(node.textContent).toBe('a');

        page('b');
        expect(render).toBe(1);             // not re-rendered
        expect(update).toBe(1);
        expect(dom.firstChild).toBe(node);  // same text node, mutated in place
        expect(node.textContent).toBe('b');
    });

    test('childNodes is a distinct intake param, not folded into props', ({ expect }) => {
        const tCard = makeP('rr-d-children');
        let seenProps = null, seenChildren = null;
        const card = {
            initialize(props, childNodes) {
                seenProps = props;
                seenChildren = childNodes;
                this.id = props.id;
            },
            render() { return tCard(`#${this.id}`); },
            update(props) { this.id = props.id; return this.render(); },
        };
        const host = makeHost('rr-d-childhost');
        const childNodes = ['child']; // stand-in for the tuple's third slot
        const page = rerenderer(id => host([card, { id }, childNodes]));

        page(1);
        expect(seenProps).toEqual({ id: 1 });
        expect(seenChildren).toBe(childNodes); // distinct param, passed straight through
    });

});

describe('rerenderer — Channel update verb (increment e)', () => {

    const channelBind = targets => {
        const t0 = targets[0];
        return v0 => composeComponent(t0, v0);
    };
    const makeHost = id =>
        render(id, slotTargets, channelBind, false, `<p data-bind><!--az:0--></p>`);

    // A minimal Observable whose subscribe/unsubscribe we can count.
    const observable = () => {
        const calls = { subscribe: 0, unsubscribe: 0 };
        const obs = {
            subscribe() {
                calls.subscribe++;
                return { unsubscribe() { calls.unsubscribe++; } };
            },
        };
        return { obs, calls };
    };
    const tick = () => new Promise(r => setTimeout(r));

    test('same source ref across rebinds: no re-subscribe, subscription kept', async ({ expect }) => {
        const { obs, calls } = observable();
        const host = makeHost('rr-e-same');
        // source closed over (stable ref); label drives the rebind
        const page = rerenderer(label =>
            host([Channel, { source: obs, as: v => `${label}:${v}` }, document.createTextNode('…')]));

        page('a');
        await tick();
        expect(calls.subscribe).toBe(1);

        page('b');                            // same obs ref → update is a no-op
        await tick();
        expect(calls.subscribe).toBe(1);      // NOT re-subscribed
        expect(calls.unsubscribe).toBe(0);    // the live subscription is kept
    });

    test('new source ref: prior subscription torn down, new one opened', async ({ expect }) => {
        const a = observable();
        const b = observable();
        const host = makeHost('rr-e-switch');
        const page = rerenderer(src =>
            host([Channel, { source: src, as: v => `${v}` }, document.createTextNode('…')]));

        page(a.obs);
        await tick();
        expect(a.calls.subscribe).toBe(1);

        page(b.obs);                          // switch source
        expect(a.calls.unsubscribe).toBe(1);  // old torn down synchronously via abort
        await tick();
        expect(b.calls.subscribe).toBe(1);    // new source subscribed
        expect(a.calls.subscribe).toBe(1);    // old not re-touched
    });

    test('successive switches: each replacement becomes the live instance, torn down on the next', async ({ expect }) => {
        const a = observable(), b = observable(), c = observable();
        const host = makeHost('rr-e-chain');
        const page = rerenderer(src =>
            host([Channel, { source: src }, document.createTextNode('…')]));

        page(a.obs); await tick();
        page(b.obs); await tick();            // a torn down; b is now the cached instance
        page(c.obs); await tick();            // b torn down → proves b became the update target

        expect(a.calls.unsubscribe).toBe(1);
        expect(b.calls.subscribe).toBe(1);
        expect(b.calls.unsubscribe).toBe(1);  // the re-cache chained: b was live, then replaced
        expect(c.calls.subscribe).toBe(1);
        expect(c.calls.unsubscribe).toBe(0);  // c is the current live instance
    });

});
