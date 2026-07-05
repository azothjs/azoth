/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * KEYED LIST — AUTHORING (author-first)
 *
 * This file is written author-first: it is the code we want an author to
 * write, and it drives the implementation. RED until KeyedUList lands.
 *
 * The stance (see docs/design/keyed-list.md):
 *  - A keyed list is a PURE-PLATFORM custom element — hyphenated tag, the
 *    platform upgrades it, a new render frame out of the forward-only flow.
 *  - Authoring is class-based: extend the semantic leaf (KeyedUList →
 *    <ul>/<li>), define `key` and `view` as FUNCTION-VALUED PROPS (the
 *    rerenderer thunks) in the constructor (runs once; connected/disconnected
 *    cycle through).
 *  - The ops keep the delta: add / addAll / update / move / remove — no
 *    reconcile-by-diff. `update(key, data)` rebinds that row's node IN PLACE
 *    (its own per-row rerenderer — the Q3 contract this file also covers).
 *
 * Provisional: module home (`@azothjs/maya/lists`) and the JSX form
 * `<pet-list/>` (needs an IntrinsicElements declaration — the next
 * author-first constraint) are TBD. This file creates via
 * document.createElement to isolate the authoring stance from JSX typing.
 *
 * JSX kept inline (single-line) so snapshots don't pick up whitespace nodes.
 * Expected HTML was generated via `toMatchInlineSnapshot` + `-u`, then frozen
 * to `.toBe(...)` — the `-u` updater coalesces multiple snapshots per file
 * (unfixed in vitest 4.x; see CLAUDE.md).
 */
import { describe, test } from 'vitest';
import { KeyedUList, KeyedOList, KeyedTable } from '@azothjs/maya/lists';
import { rerenderer } from '@azothjs/maya/renderer';

type Pet = { id: number; name: string };

class PetList extends KeyedUList {
    constructor() {
        super();
        this.key  = (p: Pet) => p.id;                 // identity (setup, runs once)
        this.view = (p: Pet) => <li>{p.name}</li>;    // the row's rerenderable thunk
    }
}
if(!customElements.get('pet-list')) customElements.define('pet-list', PetList);

describe('KeyedUList — authoring', () => {

    test('subclass renders keyed rows into its own <ul>', ({ expect }) => {
        const list = document.createElement('pet-list') as PetList;
        document.body.append(list);                   // connect → builds the <ul>
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
        expect(list.outerHTML).toBe('<pet-list><ul><li>Felix<!--1--></li><li>Mittens<!--1--></li></ul></pet-list>');
    });

    test('update(key, data) rebinds that row IN PLACE — same node, new value', ({ expect }) => {
        const list = document.createElement('pet-list') as PetList;
        document.body.append(list);
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);

        const before = list.get(1);                   // the <li> for key 1
        list.update(1, { id: 1, name: 'Felicia' });
        const after = list.get(1);

        expect(after).toBe(before);                   // per-row rerenderer: same node
        expect(list.outerHTML).toBe('<pet-list><ul><li>Felicia<!--1--></li><li>Mittens<!--1--></li></ul></pet-list>');
    });

});

describe('KeyedUList — ops', () => {

    const make = () => {
        const list = document.createElement('pet-list') as PetList;
        document.body.append(list);
        return list;
    };
    const order = (list: PetList) => [...list.root.children].map(n => n.textContent);

    test('add — variadic: one, several, or spread (each arg is a row)', ({ expect }) => {
        const list = make();
        list.add({ id: 1, name: 'Felix' });
        list.add({ id: 2, name: 'Mittens' }, { id: 3, name: 'Tom' });
        list.add(...[{ id: 4, name: 'Ada' }]);
        expect(list.size).toBe(4);
        expect(order(list)).toEqual(['Felix', 'Mittens', 'Tom', 'Ada']);
    });

    test('remove — drops the row, its node, and its key', ({ expect }) => {
        const list = make();
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }, { id: 3, name: 'Tom' }]);
        list.remove(2);
        expect(list.size).toBe(2);
        expect(list.has(2)).toBe(false);
        expect(list.get(2)).toBe(null);
        expect(order(list)).toEqual(['Felix', 'Tom']);
    });

    test('move — key-relative: before another row, or to the end', ({ expect }) => {
        const list = make();
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }, { id: 3, name: 'Tom' }]);
        list.move(3, 1);                              // Tom before Felix
        expect(order(list)).toEqual(['Tom', 'Felix', 'Mittens']);
        list.move(1, null);                           // Felix to the end (no beforeKey)
        expect(order(list)).toEqual(['Tom', 'Mittens', 'Felix']);
    });

    test('clear — empties the DOM and the key map', ({ expect }) => {
        const list = make();
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
        list.clear();
        expect(list.size).toBe(0);
        expect(order(list)).toEqual([]);
    });

    test('insert — place one row before another (positional add); null → append', ({ expect }) => {
        const list = make();
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
        list.insert({ id: 3, name: 'Tom' }, 2);       // before Mittens
        expect(order(list)).toEqual(['Felix', 'Tom', 'Mittens']);
        list.insert({ id: 4, name: 'Ada' }, null);    // no beforeKey → append
        expect(order(list)).toEqual(['Felix', 'Tom', 'Mittens', 'Ada']);
        expect(list.size).toBe(4);
    });

    test('keyFor — event target → its row key (inverse of get), walking to the row root', ({ expect }) => {
        const list = make();
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
        const li = list.get(1)!;
        expect(list.keyFor(li)).toBe(1);              // the row root itself
        expect(list.keyFor(li.firstChild!)).toBe(1);  // a descendant (the text node)
        expect(list.keyFor(list)).toBe(undefined);    // outside any row
    });

});

describe('KeyedOList / KeyedTable — semantic leaves', () => {

    test('KeyedOList owns an <ol> and manages <li> rows', ({ expect }) => {
        class NumList extends KeyedOList {
            constructor() {
                super();
                this.key = (n: { id: number; label: string }) => n.id;
                this.view = (n: { id: number; label: string }) => <li>{n.label}</li>;
            }
        }
        if(!customElements.get('num-list')) customElements.define('num-list', NumList);

        const list = document.createElement('num-list') as KeyedOList;
        document.body.append(list);
        list.addAll([{ id: 1, label: 'one' }, { id: 2, label: 'two' }]);

        const ol = list.querySelector('ol')!;
        expect([...ol.children].map(li => li.tagName)).toEqual(['LI', 'LI']);
        expect([...ol.children].map(li => li.textContent)).toEqual(['one', 'two']);
    });

    test('KeyedTable owns <table><tbody> and manages <tr> rows in the tbody', ({ expect }) => {
        class RowList extends KeyedTable {
            constructor() {
                super();
                this.key = (r: { id: number; name: string }) => r.id;
                this.view = (r: { id: number; name: string }) => <tr><td>{r.name}</td></tr>;
            }
        }
        if(!customElements.get('row-list')) customElements.define('row-list', RowList);

        const list = document.createElement('row-list') as KeyedTable;
        document.body.append(list);
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);

        const tbody = list.querySelector('table > tbody')!;
        expect([...tbody.children].map(tr => tr.tagName)).toEqual(['TR', 'TR']);
        expect([...tbody.querySelectorAll('td')].map(td => td.textContent)).toEqual(['Felix', 'Mittens']);
        expect(list.update(1, { id: 1, name: 'Felicia' })).toBe(tbody.children[0]); // in-place, same <tr>
        expect(tbody.querySelector('td')!.textContent).toBe('Felicia');
    });

});

describe('KeyedUList — nested inside a rerenderer (the frame boundary)', () => {

    // A keyed list lives inside a re-rendering region. The custom element is a
    // separate render frame: the outer rerenderer reuses the element by site
    // and never reaches into its internals, so its imperatively-managed rows
    // survive an outer re-render. (If this holds, the fresh-Renderer-frame
    // reset is moot — see docs/design/keyed-list.md.)
    test('outer re-render reuses the element; its rows survive', ({ expect }) => {
        const render = rerenderer((label: string) =>
            <section><h2>{label}</h2><pet-list></pet-list></section>);

        const section = render('Pets') as HTMLElement;
        document.body.append(section);                // connect → pet-list builds its <ul>
        const list = section.querySelector('pet-list') as PetList;
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
        expect([...list.root.children].map(n => n.textContent)).toEqual(['Felix', 'Mittens']);

        const again = render('Animals');              // outer rerenderer re-runs
        expect(again).toBe(section);                  // same section (site cache)
        expect(section.querySelector('pet-list')).toBe(list);            // element reused, not rebuilt
        expect(section.querySelector('h2')!.textContent).toBe('Animals'); // outer binding rebound
        expect([...list.root.children].map(n => n.textContent)).toEqual(['Felix', 'Mittens']); // rows intact
    });

    // Stronger: hold the element as a JS ref and compose it via {list}. azoth
    // owns the JSX call-site, so confirm it's referentially transparent — the
    // same element flows through, re-renders don't replace it, rows survive.
    test('an externally-held element ref composed via {list} stays the same element', ({ expect }) => {
        const list = <pet-list></pet-list> as PetList;     // created once, held
        const render = rerenderer((label: string) =>
            <section><h2>{label}</h2>{list}</section>);

        const section = render('Pets') as HTMLElement;
        document.body.append(section);                     // connect → builds the <ul>
        expect(section.querySelector('pet-list')).toBe(list);   // the very ref, composed in
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);

        const again = render('Animals');                   // {list} is the same ref → no-op at the anchor
        expect(again).toBe(section);
        expect(section.querySelector('pet-list')).toBe(list);              // still the same element
        expect(section.querySelector('h2')!.textContent).toBe('Animals');  // sibling binding rebound
        expect([...list.root.children].map(n => n.textContent)).toEqual(['Felix', 'Mittens']); // rows intact
    });

});

describe('Controller — the source axis (author-defined bridge)', () => {

    // A controller bridges a data SOURCE to LIST OPS. azoth ships none — this is
    // the contract/recipe an author (or a per-source library) implements. The
    // source's delta maps straight to an op; no reconcile-by-diff.
    //
    // Stub source: an EventTarget standing in for supabase realtime / a
    // websocket feed (mocks are fine for controllers).
    class FeedStub extends EventTarget {
        insert(pet: { id: number; name: string }) { this.dispatchEvent(new CustomEvent('insert', { detail: pet })); }
        update(pet: { id: number; name: string }) { this.dispatchEvent(new CustomEvent('update', { detail: pet })); }
        remove(id: number) { this.dispatchEvent(new CustomEvent('remove', { detail: id })); }
    }

    class FeedController {
        constructor(public source: FeedStub, list: PetList) {
            this.#on('insert', e => list.add(e.detail));
            this.#on('update', e => list.update(e.detail.id, e.detail));
            this.#on('remove', e => list.remove(e.detail));
        }
        #offs: Array<() => void> = [];
        #on(type: string, fn: (e: any) => void) {
            this.source.addEventListener(type, fn);
            this.#offs.push(() => this.source.removeEventListener(type, fn));
        }
        dispose() { this.#offs.forEach(off => off()); }   // pairs to disconnectedCallback
    }

    test('source events drive add / update (in place) / remove; dispose tears down', ({ expect }) => {
        const feed = new FeedStub();
        const list = document.createElement('pet-list') as PetList;
        document.body.append(list);
        const ctl = new FeedController(feed, list);

        feed.insert({ id: 1, name: 'Felix' });
        feed.insert({ id: 2, name: 'Mittens' });
        expect([...list.root.children].map(n => n.textContent)).toEqual(['Felix', 'Mittens']);

        const li1 = list.get(1);
        feed.update({ id: 1, name: 'Felicia' });
        expect(list.get(1)).toBe(li1);                    // delta → update(key): same node, in place
        expect(li1!.textContent).toBe('Felicia');

        feed.remove(2);
        expect(list.has(2)).toBe(false);
        expect([...list.root.children].map(n => n.textContent)).toEqual(['Felicia']);

        ctl.dispose();
        feed.insert({ id: 3, name: 'Tom' });              // after teardown: no effect
        expect(list.has(3)).toBe(false);
    });

});
