/**
 * rerenderer(renderFn) → (...args) => result
 *
 * Re-execution with an identity-keyed cache. The wrapped function
 * re-runs as ordinary JavaScript — control flow stays in charge — and
 * each template factory call consults the active Rerenderer for "do
 * you have my instance?" Same nodes come back, rebound with new values.
 *
 * The hooks coin: React re-executes against a cache keyed by call
 * order, so control flow around hooks is forbidden. This re-executes
 * against a cache keyed by site identity, so control flow just works.
 *
 * Two caches per instance (see docs/design/rerenderer.md):
 *
 *   sites    — factory siteKey → { entries: [{ node, bind }], cursor }.
 *              Occurrence-indexed within a pass (ordinal reuse for
 *              loops: no swapping, no matching — position is position).
 *              Prune rule at pass exit: lists shrink (cursor > 0 →
 *              truncate to cursor), branches sleep (cursor === 0 →
 *              retain; a branch not taken is sleeping, not dead).
 *
 *   anchors  — WeakMap<anchorComment, { lastValue }>. compose consults
 *              it while a rerenderer is active: composing the IDENTICAL
 *              value at an anchor is idempotent (===, no structure
 *              inspected). Prevents re-subscribing single-consumer
 *              sources on rebind; makes master/detail free (same ref →
 *              untouched, new ref → full replace).
 *
 * Scope convention: wrap the narrowest expression. Components run once
 * and RETURN their rerenderable — never rerenderer(Component).
 * The thunk's parameters are the update surface; its closures are the
 * setup surface.
 */

const stack = [];

export function activeRerenderer() {
    return stack.length ? stack[stack.length - 1] : null;
}

class Rerenderer {
    #sites = new Map();
    #anchors = new WeakMap();
    #pass = 0;

    run(renderFn, args) {
        this.#pass++;
        for(const site of this.#sites.values()) site.cursor = 0;
        stack.push(this);
        try {
            return renderFn(...args);
        }
        finally {
            const popped = stack.pop();
            if(popped !== this) throw new Error('Rerenderer stack error');
            for(const site of this.#sites.values()) {
                // cursor > 0: site participated — truncate (lists shrink).
                // cursor === 0: site didn't run — retain (branches sleep).
                if(site.cursor > 0 && site.entries.length > site.cursor) {
                    site.entries.length = site.cursor;
                }
            }
        }
    }

    // Called by template render functions (renderer.js) during a pass.
    // siteKey is the per-declaration closure identity; make builds a
    // fresh [node, bind] on miss.
    getBound(siteKey, make) {
        let site = this.#sites.get(siteKey);
        if(!site) {
            site = { entries: [], cursor: 0 };
            this.#sites.set(siteKey, site);
        }
        const i = site.cursor++;
        return site.entries[i] ?? (site.entries[i] = make());
    }

    // Called by compose while this rerenderer is active. The identical
    // value at an anchor is one instruction, not two.
    //
    // The memo holds the OUTERMOST input per pass: compose recurses
    // (render objects, functions, Channel initial/source) at the same
    // anchor, and those inner writes must not overwrite the memo — the
    // next pass compares the outer input, not the inner output. The
    // pass counter locks the first write of each pass.
    skipIfSame(anchor, value) {
        const memo = this.#anchors.get(anchor);
        if(memo) {
            if(memo.lastValue === value) return true;
            if(memo.pass === this.#pass) return false; // recursion — keep outermost
            memo.lastValue = value;
            memo.pass = this.#pass;
            return false;
        }
        this.#anchors.set(anchor, { lastValue: value, pass: this.#pass });
        return false;
    }
}

export function rerenderer(renderFn) {
    if(typeof renderFn !== 'function') {
        throw new TypeError(
            `rerenderer requires a function. Received "${typeof renderFn}". ` +
            `Wrap the JSX in a thunk: rerenderer(() => <p>{value}</p>) — ` +
            `the expression form evaluates before rerenderer can re-run it.`
        );
    }
    const rr = new Rerenderer();
    return (...args) => rr.run(renderFn, args);
}
