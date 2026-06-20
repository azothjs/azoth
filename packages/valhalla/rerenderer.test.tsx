/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * RERENDERER TESTS (JSX-driven)
 *
 * End-to-end validation of the Rerenderer through REAL compiled JSX —
 * thoth emits per-site factories, rerenderer wraps the thunk, and
 * re-invocation rebinds the same DOM (new props, same nodes). The maya
 * unit tests exercise the same machinery against hand-built renderer(...)
 * calls (what thoth emits); these prove the compiled path agrees.
 *
 * JSX is kept inline (single-line) so HTML snapshots don't pick up
 * whitespace text nodes between siblings.
 *
 * See packages/maya/renderer/rerenderer.test.js for the unit layer and
 * docs/design/rerenderer.md for the design.
 */
import { describe, test } from 'vitest';
import { rerenderer } from '@azothjs/maya/renderer';
import { Channel } from '@azothjs/maya/channels';

// Microtask flush — lets a resolved promise's .then chain land.
const microtasks = () => Promise.resolve().then(() => Promise.resolve());

describe('rerenderer — JSX-driven', () => {

    test('re-execution rebinds the same DOM node', ({ expect }) => {
        const render = rerenderer((name: string) => <p>{name}</p>);

        const first = render('felix') as HTMLParagraphElement;
        expect(first.outerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p>"`);

        const second = render('duchess');
        expect(second).toBe(first);              // same node, rebound
        expect(first.outerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p>"`);
    });

    test('conditional branches: each cached by its own site; sleeping, not dead', ({ expect }) => {
        const render = rerenderer((flag: boolean, v: string) =>
            flag ? <p>A:{v}</p> : <div>B:{v}</div>);

        const a1 = render(true, 'x') as HTMLElement;
        const b1 = render(false, 'y') as HTMLElement;
        expect(b1).not.toBe(a1);
        expect(a1.textContent).toBe('A:x');
        expect(b1.textContent).toBe('B:y');

        // Flip back: branch A slept (not pruned) → same node resurrected.
        const a2 = render(true, 'z');
        expect(a2).toBe(a1);
        expect(a1.textContent).toBe('A:z');
    });

    test('loops: ordinal reuse — same nodes by position; lists shrink and regrow', ({ expect }) => {
        const render = rerenderer((items: string[]) =>
            <ul>{items.map(x => <li>{x}</li>)}</ul>);

        const ul = render(['a', 'b', 'c']) as HTMLUListElement;
        const [li0, li1, li2] = [...ul.children];
        expect([...ul.children].map(n => n.textContent)).toEqual(['a', 'b', 'c']);

        // Shrink: positions 0,1 reused in order; tail removed.
        render(['x', 'y']);
        expect(ul.children[0]).toBe(li0);
        expect(ul.children[1]).toBe(li1);
        expect([...ul.children].map(n => n.textContent)).toEqual(['x', 'y']);

        // Regrow: 0,1 still the same nodes; 2 is NEW (old tail was pruned).
        render(['1', '2', '3']);
        expect(ul.children[0]).toBe(li0);
        expect(ul.children[1]).toBe(li1);
        expect(ul.children[2]).not.toBe(li2);
        expect([...ul.children].map(n => n.textContent)).toEqual(['1', '2', '3']);
    });

    test('deduped templates cannot collide: per-site factory identity', ({ expect }) => {
        // Two <p>{x}</p> expressions share ONE template (same HTML) but are
        // distinct call sites — closure identity keys the cache, so they
        // never hand each other's node back.
        const render = rerenderer((a: string, b: string) =>
            <main><p>{a}</p><p>{b}</p></main>);

        const main = render('left', 'right') as HTMLElement;
        const [p0, p1] = [...main.children];
        expect(p1).not.toBe(p0);
        expect(p0.textContent).toBe('left');
        expect(p1.textContent).toBe('right');

        render('L', 'R');
        expect(main.children[0]).toBe(p0);
        expect(main.children[1]).toBe(p1);
        expect(p0.textContent).toBe('L');
        expect(p1.textContent).toBe('R');
    });

    test('nested rerenderer is stable inside an outer pass', ({ expect }) => {
        const inner = rerenderer((v: string) => <span>{v}</span>);
        const outer = rerenderer((v: string) => <p>{inner(v)}</p>);

        const o1 = outer('felix') as HTMLParagraphElement;
        const innerNode = o1.firstChild;
        expect(innerNode?.textContent).toBe('felix');

        const o2 = outer('duchess');
        expect(o2).toBe(o1);
        expect(o1.firstChild).toBe(innerNode); // inner node never moved
        expect(innerNode?.textContent).toBe('duchess');
    });

    test('component in the wrap: setup runs once, the returned rerenderable re-invokes', ({ expect }) => {
        let setupCount = 0;
        function CatCard({ id }: { id: number }) {
            setupCount++; // the setup zone — must run ONCE
            return rerenderer((props: { id: number }) => <p>cat #{props.id}</p>);
        }
        const page = rerenderer((id: number) => <main><CatCard id={id} /></main>);

        const main = page(1) as HTMLElement;
        const card = main.firstElementChild as HTMLElement;
        expect(setupCount).toBe(1);
        expect(card.textContent).toBe('cat #1');

        page(2);
        expect(setupCount).toBe(1);                // setup protected
        expect(main.firstElementChild).toBe(card); // same DOM node
        expect(card.textContent).toBe('cat #2');   // new prop flowed
    });

    test('module factory: the returned closure IS the rerenderable (no inner rerenderer)', ({ expect }) => {
        // Two related-but-separate things meet here:
        //   1. The rerenderer changes the FLOW — DOM made on the first call is
        //      reused (rebound with new props) on later calls, not recreated.
        //   2. Initial-render-then-update is a plain JS pattern the author
        //      already knows. Here it's a module factory: setup closes over
        //      state and returns a render fn. (Classes do it with
        //      constructor/render, objects with initialize/render — standard
        //      CS, all in the corpus.)
        // The rerenderer just LINKS that pattern to JSX-as-DOM: a component's
        // returned function is the rerenderable, re-invoked with new props
        // while the setup zone runs once. The inner rerenderer() in the test
        // above is safe but redundant — a rerenderer is a cache over template
        // calls, and one suffices here. Nothing azoth-specific to learn;
        // subtract to unlock.
        let setupCount = 0;
        // The cast is the known typing gap: a component returning its
        // rerenderable (a function) isn't yet modeled by JSX.Element — the
        // same `as unknown as JSX.Element` workaround as channels.test.tsx.
        // The TypeScript review (TODO §Components) is where this gets typed.
        function CatCard({ count = 0 }: { count?: number; id: number }) {
            setupCount++; // setup zone — runs ONCE
            return (({ id }: { id: number }) =>
                <p>cat #{id} rendered {++count} times</p>) as unknown as JSX.Element;
        }
        const page = rerenderer((id: number) => <main><CatCard count={5} id={id} /></main>);

        const main = page(1) as HTMLElement;
        const card = main.firstElementChild as HTMLElement;
        expect(setupCount).toBe(1);
        expect(card.textContent).toBe('cat #1 rendered 6 times'); // count: 5 → 6

        page(2);
        expect(setupCount).toBe(1);                  // setup ran once
        expect(main.firstElementChild).toBe(card);   // same DOM node, rebound
        expect(card.textContent).toBe('cat #2 rendered 7 times'); // same closure: 6 → 7
    });

    test('Channel in the wrap: switching source shows the new value; a late stale resolve is ignored', async ({ expect }) => {
        const a = Promise.withResolvers<string>();
        const b = Promise.withResolvers<string>();
        const view = (v: string) => <p>{v}</p>;
        const page = rerenderer((src: Promise<string>) =>
            <main><Channel source={src} as={view}>loading</Channel></main>);

        const main = page(a.promise) as HTMLElement;
        expect(main.textContent).toContain('loading');

        // Switch to b BEFORE a resolves.
        page(b.promise);
        b.resolve('B');
        await microtasks();
        expect(main.textContent).toContain('B');

        // a resolves late — it was switched away from, so it must NOT clobber.
        a.resolve('A');
        await microtasks();
        expect(main.textContent).toContain('B');
        expect(main.textContent).not.toContain('A');
    });

});
