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
 * Provisional: module home (`@azothjs/maya/blocks`) and the JSX form
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
import { KeyedUList } from '@azothjs/maya/blocks';

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

    test('move — the row ends up at the given index (forward and back)', ({ expect }) => {
        const list = make();
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }, { id: 3, name: 'Tom' }]);
        list.move(3, 0);                              // to front
        expect(order(list)).toEqual(['Tom', 'Felix', 'Mittens']);
        list.move(3, 2);                              // forward, to end
        expect(order(list)).toEqual(['Felix', 'Mittens', 'Tom']);
    });

    test('clear — empties the DOM and the key map', ({ expect }) => {
        const list = make();
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
        list.clear();
        expect(list.size).toBe(0);
        expect(order(list)).toEqual([]);
    });

    test('keyAt — event target → its row key, walking up to the row root', ({ expect }) => {
        const list = make();
        list.addAll([{ id: 1, name: 'Felix' }, { id: 2, name: 'Mittens' }]);
        const li = list.get(1)!;
        expect(list.keyAt(li)).toBe(1);               // the row root itself
        expect(list.keyAt(li.firstChild!)).toBe(1);   // a descendant (the text node)
        expect(list.keyAt(list)).toBe(undefined);     // outside any row
    });

});
