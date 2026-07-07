/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * COMPOSE — THE {…} SLOT
 *
 * A slot has one job: turn this value, whatever it is, into DOM at this
 * position. One dispatch, first match wins (packages/maya/compose/compose.js):
 *
 *   values     string · number · bigint → text; undefined · null · true ·
 *              false · '' → render nothing; Node → inserted; array → each
 *              member composes at the slot
 *   functions  called with NO args — a deferred value, not a component
 *              (component invocation <Fn/> is what passes props)
 *   async      Promise · async iterable (async generators, ReadableStream)
 *              · Observable — each value REPLACES the previous, one rule
 *              for every source; accumulation opts in upstream via
 *              Channel/Input `append`
 *   Input      { initial?, from, append? } — seed the slot, then drive it
 *              from a source; recognized by shape (Channel is one
 *              implementer — see channels.test.tsx)
 *
 * Anchor notation in the HTML: <!--az:N--> is the slot's bookkeeping —
 * azoth's comment anchor holding the count of nodes the slot currently
 * owns. `data-bind` marks elements that carry bindings. See README.md
 * ("Reading the snapshots").
 *
 * Observable-in-a-slot is covered in channels.test.tsx. JSX is kept inline
 * (single-line) so snapshots don't pick up whitespace text nodes. Multi-
 * stage tests collect stages in a `seq` array. Expected values are frozen
 * generated output (toBe/toEqual per CLAUDE.md — the vitest inline-snapshot
 * updater mis-writes in browser mode; see TODO.md).
 */

import { describe, test } from 'vitest';

function fixture(): HTMLElement {
    document.body.innerHTML = '';
    return document.body;
}

// Microtask flush — lets a resolved promise's .then chain land.
async function microtasks(): Promise<void> {
    await null;
    await null;
}

// Macrotask boundary — drains multi-hop async pipelines (generator yields).
async function macrotask(): Promise<void> {
    await new Promise(r => setTimeout(r, 0));
}

describe('values', () => {

    test('strings and numbers become text — including 0', ({ expect }) => {
        const root = fixture();
        root.append(<main><p>{'felix'}</p><p>lives: {9}</p><p>treats: {0}</p></main>);

        expect(root.innerHTML).toBe('<main><p data-bind="">felix<!--az:1--></p><p data-bind="">lives: 9<!--az:1--></p><p data-bind="">treats: 0<!--az:1--></p></main>');
    });

    test('undefined, null, true, false, and empty string render nothing', ({ expect }) => {
        const root = fixture();
        root.append(<main><p>{undefined}</p><p>{null}</p><p>{true}</p><p>{false}</p><p>{''}</p></main>);

        // Each slot's anchor owns nothing — az:0 across the board.
        expect(root.innerHTML).toBe('<main><p data-bind=""><!--az:0--></p><p data-bind=""><!--az:0--></p><p data-bind=""><!--az:0--></p><p data-bind=""><!--az:0--></p><p data-bind=""><!--az:0--></p></main>');
    });

    test('the conditional idiom: cond && <el/>', ({ expect }) => {
        const isHungry = (cat: string) => cat === 'garfield';
        const Status = ({ cat }: { cat: string }) => <p>{cat}{isHungry(cat) && <em> — feed me</em>}</p>;
        const root = fixture();
        root.append(<main><Status cat="felix" /><Status cat="garfield" /></main>);

        // felix's && slot is false → az:0, owning nothing (a slot that can
        // wake later). garfield's holds the <em> → az:1. The az:1 after each
        // </p> is the component slot that <Status/> composed into.
        expect(root.innerHTML).toBe('<main><p>felix<!--az:1--><!--az:0--></p><!--az:1--><p>garfield<!--az:1--><em> — feed me</em><!--az:1--></p><!--az:1--></main>');
    });

    test('a pre-built Node is inserted as-is', ({ expect }) => {
        const badge = <em>award-winning</em>;
        const root = fixture();
        root.append(<main><p>duchess, {badge}</p></main>);

        expect(root.innerHTML).toBe('<main><p data-bind="">duchess, <em>award-winning</em><!--az:1--></p></main>');
    });

    test('an array composes each member at the slot', ({ expect }) => {
        const cats = ['felix', 'duchess', 'tom'];
        const root = fixture();
        root.append(<ul>{cats.map(cat => <li>{cat}</li>)}</ul>);

        // One anchor, three owned nodes: az:3.
        expect(root.innerHTML).toBe('<ul><li>felix<!--az:1--></li><li>duchess<!--az:1--></li><li>tom<!--az:1--></li><!--az:3--></ul>');
    });

});

describe('functions — deferred values, not components', () => {

    test('a function in a slot is called with no args; its result composes', ({ expect }) => {
        // {fn} defers evaluation to compose time — nothing is passed to it.
        // Props/childNodes intake belongs to component invocation: <Fn/>.
        const stamp = () => <time>nap time</time>;
        const root = fixture();
        root.append(<footer>{stamp}</footer>);

        expect(root.innerHTML).toBe('<footer><time>nap time</time><!--az:1--></footer>');
    });

});

describe('async values — direct in slots, no wrapper needed', () => {

    test('a promise: nothing until it resolves, then its value replaces', async ({ expect }) => {
        const seq: string[] = [];
        const { promise, resolve } = Promise.withResolvers<JSX.Element>();
        const root = fixture();
        root.append(<main>{promise}</main>);

        seq.push(root.innerHTML);          // before resolve — anchor owns nothing

        resolve(<p>felix</p>);
        await microtasks();
        seq.push(root.innerHTML);          // resolved value replaced in

        expect(seq).toEqual([
            '<main><!--az:0--></main>',
            '<main><p>felix</p><!--az:1--></main>',
        ]);
    });

    test('an async generator: each yield replaces the previous', async ({ expect }) => {
        async function* mood() {
            yield <p>sleepy</p>;
            yield <p>hungry</p>;
        }
        const root = fixture();
        root.append(<main>{mood()}</main>);

        await macrotask();

        // Only the last yield is visible — replace, not accumulate.
        expect(root.innerHTML).toBe('<main><p>hungry</p><!--az:1--></main>');
    });

    test('a ReadableStream is just an async iterable: each chunk replaces', async ({ expect }) => {
        // One rule for every async sequence. To accumulate chunks, opt in
        // upstream: <Channel source={stream} append/> (channels.test.tsx).
        const stream = new ReadableStream<string>({
            start(controller) {
                controller.enqueue('felix');
                controller.enqueue('duchess');
                controller.close();
            }
        });
        const root = fixture();
        root.append(<main>{stream}</main>);

        await macrotask();

        expect(root.innerHTML).toBe('<main>duchess<!--az:1--></main>');
    });

});

describe('the Input shape — { initial?, from, append? }', () => {

    test('seed the slot with initial, then the source value replaces it', async ({ expect }) => {
        const seq: string[] = [];
        const { promise, resolve } = Promise.withResolvers<JSX.Element>();
        const root = fixture();
        root.append(<main>{{ initial: <p>loading</p>, from: promise }}</main>);

        seq.push(root.innerHTML);          // the seed shows immediately

        resolve(<p>felix</p>);
        await microtasks();
        seq.push(root.innerHTML);          // source value replaced the seed

        expect(seq).toEqual([
            '<main><p>loading</p><!--az:1--></main>',
            '<main><p>felix</p><!--az:1--></main>',
        ]);
    });

    test('append: the first source value replaces the seed, the rest accumulate', async ({ expect }) => {
        const seq: string[] = [];
        async function* arrivals() {
            yield <li>felix</li>;
            yield <li>duchess</li>;
        }
        const root = fixture();
        root.append(<ul>{{ initial: <li>empty lobby</li>, from: arrivals(), append: true }}</ul>);

        seq.push(root.innerHTML);          // seed

        await macrotask();
        seq.push(root.innerHTML);          // felix replaced the seed; duchess accumulated

        expect(seq).toEqual([
            '<ul><li>empty lobby</li><!--az:1--></ul>',
            '<ul><li>felix</li><li>duchess</li><!--az:2--></ul>',
        ]);
    });

});

describe('anchors — reading the bookkeeping', () => {

    test('az:N counts the nodes the slot currently owns', ({ expect }) => {
        // Empty slot: az:0. One value: az:1. An array: one per member.
        // The anchor comment stays put; content composes before it.
        const root = fixture();
        root.append(<main><p>{null}</p><p>{'felix'}</p><ul>{['a', 'b', 'c'].map(x => <li>{x}</li>)}</ul></main>);

        expect(root.innerHTML).toBe('<main><p data-bind=""><!--az:0--></p><p data-bind="">felix<!--az:1--></p><ul data-bind=""><li>a<!--az:1--></li><li>b<!--az:1--></li><li>c<!--az:1--></li><!--az:3--></ul></main>');
    });

});
