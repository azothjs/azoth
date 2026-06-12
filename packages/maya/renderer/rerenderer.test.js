import { describe, test, beforeAll } from 'vitest';
import { compose, composeComponent, createComponent } from '../compose/compose.js';
import { renderer, RenderService } from './renderer.js';
import { rerenderer } from './rerenderer.js';

/**
 * Increment (a) of the Rerenderer spike — runtime only, intrinsic only.
 * Templates are hand-built renderer(...) calls (what thoth emits), per
 * the pattern in controller.test.js. See docs/design/rerenderer.md.
 */

beforeAll(() => RenderService.useDOMEngine());

// <p data-bind><!--0--></p> with one child slot — the standard test shape.
const slotTargets = r => [r.childNodes[0]];
const slotBind = targets => {
    const t0 = targets[0];
    return v0 => compose(t0, v0);
};
const makeP = id => renderer(id, slotTargets, slotBind, false, `<p data-bind><!--0--></p>`);

describe('rerenderer — the gate', () => {

    test('non-function throws (the expression form evaluated too early)', ({ expect }) => {
        expect(() => rerenderer('nope')).toThrow(/requires a function/);
        expect(() => rerenderer(document.createElement('div')))
            .toThrow(/requires a function/);
        expect(() => rerenderer(undefined)).toThrow(/requires a function/);
    });

});

describe('rerenderer — same nodes, new values', () => {

    test('re-execution rebinds the same DOM', ({ expect }) => {
        const t = makeP('rr-basic');
        const fn = rerenderer(name => t(name));

        const n1 = fn('felix');
        expect(n1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">felix<!--1--></p>"`);

        const n2 = fn('duchess');
        expect(n2).toBe(n1); // same node — new props, same DOM
        expect(n1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">duchess<!--1--></p>"`);
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
        const tA = renderer('rr-br-a', prefixTargets, slotBind, false, `<p data-bind>A:<!--0--></p>`);
        const tB = renderer('rr-br-b', prefixTargets, slotBind, false, `<p data-bind>B:<!--0--></p>`);
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
        const html = `<p data-bind><!--0--></p>`;
        const tX = renderer('rr-dup', slotTargets, slotBind, false, html);
        const tY = renderer('rr-dup', slotTargets, slotBind, false, html);
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

    test('accumulate path (keepLast) is exempt: repeated values are legitimate', ({ expect }) => {
        const t = makeP('rr-arr');
        const fn = rerenderer(pair => t(pair));
        // An array composes per-item with keepLast=true — two identical
        // strings must BOTH render (no false skip on the append path).
        const node = fn(['a', 'a']);
        expect(node.textContent).toBe('aa');
    });

});

describe('rerenderer — components inside the wrap (increment c)', () => {

    // Simulates the compiled component slot: bind receives the tuple
    // [Constructor, props] and calls composeComponent (what __cC does).
    const componentBind = targets => {
        const t0 = targets[0];
        return v0 => composeComponent(t0, v0);
    };
    const makeHost = id =>
        renderer(id, slotTargets, componentBind, false, `<p data-bind><!--0--></p>`);

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
