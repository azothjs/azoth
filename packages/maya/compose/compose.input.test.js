/**
 * The Input shape — { initial?, from, append? } — as a USERLAND value: bare
 * object literals, no Channel. compose recognizes the shape structurally, so
 * these are first-class inputs. The real-world scenario is nested: an outer
 * async source (the "searches") delivering inner Inputs — each seeds a loading
 * view, then resolves/streams results; a new search resets to loading.
 *
 * Snapshots are generated from real output (empty → the run fills them).
 */
import { beforeEach, test } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { elementWithAnchor } from 'test-utils/elements';
import { fixtureSetup } from 'test-utils/fixtures';
import { compose } from './compose.js';

beforeEach(fixtureSetup);

// A hand-driven async source: push(v) emits v; push(DONE) ends it. Queues a
// push that arrives before the consumer has pulled, so timing is forgiving.
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

// Search-with-loading, entirely from bare Input literals: the outer source
// yields one Input per search — a loading seed, then a Promise of results. A
// new search yields a fresh Input, so loading returns, then the new results.
test('nested Input — search with loading (Promise results; resets on new search)', async ({ expect, fixture, find }) => {
    const seq = [];
    const a = Promise.withResolvers();
    const b = Promise.withResolvers();
    const outer = driven();

    const { dom, anchor } = elementWithAnchor();
    fixture.append(dom);
    compose(anchor, outer.gen);

    outer.push({ initial: 'loading-a', from: a.promise });
    await find('loading-a'); seq.push(fixture.innerHTML);
    a.resolve('results-a');
    await find('results-a'); seq.push(fixture.innerHTML);

    outer.push({ initial: 'loading-b', from: b.promise });
    await find('loading-b'); seq.push(fixture.innerHTML);
    b.resolve('results-b');
    await find('results-b'); seq.push(fixture.innerHTML);

    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>loading-a<!--1--></div>",
        "<div>results-a<!--1--></div>",
        "<div>loading-b<!--1--></div>",
        "<div>results-b<!--1--></div>",
      ]
    `);
});

// Variation: each search's `from` STREAMS items that accumulate (append: true)
// — loading, then items append in; a new search resets to loading, then the
// new items append.
test('nested Input — search with loading (streamed items accumulate; resets on new search)', async ({ expect, fixture, find }) => {
    const seq = [];
    const outer = driven();
    const streamA = driven();
    const streamB = driven();

    const { dom, anchor } = elementWithAnchor();
    fixture.append(dom);
    compose(anchor, outer.gen);

    outer.push({ initial: 'loading-a', from: streamA.gen, append: true });
    await find('loading-a'); seq.push(fixture.innerHTML);
    streamA.push('a1'); await find('a1'); seq.push(fixture.innerHTML);
    streamA.push('a2'); await find('a1a2'); seq.push(fixture.innerHTML);

    outer.push({ initial: 'loading-b', from: streamB.gen, append: true });
    await find('loading-b'); seq.push(fixture.innerHTML);
    streamB.push('b1'); await find('b1'); seq.push(fixture.innerHTML);

    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>loading-a<!--1--></div>",
        "<div>a1<!--1--></div>",
        "<div>a1a2<!--2--></div>",
        "<div>loading-b<!--1--></div>",
        "<div>b1<!--1--></div>",
      ]
    `);
});

// Teardown on swap. When search B replaces search A, clear(anchor) cancels
// search A's stream — so a late push on it is IGNORED (the pull was torn down)
// and can't intrude on search B, which keeps flowing. compose owns this case-2
// cleanup; a Channel isn't required for it. (A higher block swap that never
// clears this anchor would instead leave the source live — the author's choice.)
test('nested Input — the stale stream is torn down on swap (no intrusion)', async ({ expect, fixture, find }) => {
    const seq = [];
    const outer = driven();
    const streamA = driven();
    const streamB = driven();

    const { dom, anchor } = elementWithAnchor();
    fixture.append(dom);
    compose(anchor, outer.gen);

    outer.push({ initial: 'loading-a', from: streamA.gen, append: true });
    await find('loading-a'); seq.push(fixture.innerHTML);
    streamA.push('a1'); await find('a1'); seq.push(fixture.innerHTML);

    outer.push({ initial: 'loading-b', from: streamB.gen, append: true });
    await find('loading-b'); seq.push(fixture.innerHTML);
    streamB.push('b1'); await find('b1'); seq.push(fixture.innerHTML);

    // search A is over — its stream was torn down at the swap. The late push is
    // ignored; search B keeps flowing (b2 appends), with no a-late intrusion.
    streamA.push('a-late');
    streamB.push('b2'); await find('b1b2'); seq.push(fixture.innerHTML);

    expect(seq).toMatchInlineSnapshot(`
      [
        "<div>loading-a<!--1--></div>",
        "<div>a1<!--1--></div>",
        "<div>loading-b<!--1--></div>",
        "<div>b1<!--1--></div>",
        "<div>b1b2<!--2--></div>",
      ]
    `);
});
