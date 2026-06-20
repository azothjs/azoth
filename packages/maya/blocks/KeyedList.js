import { rerenderer } from '../renderer/rerenderer.js';

/**
 * KeyedList — the dynamic-list specialty: add / remove / move / update over
 * keyed rows, each change keeping its delta (no reconcile-by-diff).
 *
 * A PURE-PLATFORM custom element (hyphenated tag, the platform upgrades it).
 * The element is a new render frame out of the page's forward-only flow:
 * `connectedCallback` builds the semantic root; the ops are imperative.
 *
 * Per-row identity is a JS Map, not a DOM query: `Map<key, { node, render }>`.
 * Each row holds its OWN rerenderer instance (built from the shared `view`),
 * so `update(key, data)` re-runs that row and rebinds its node IN PLACE — the
 * same `view`/site can't collide across rows because the rerenderer cache is
 * per-instance.
 *
 * Abstract base — NO tag, NO define; the extend target. Concrete leaves
 * (KeyedUList/KeyedOList/KeyedTable) fix the semantic root and self-define.
 * See docs/design/keyed-list.md.
 *
 * Subclass hooks (function-valued props, set in the subclass constructor):
 *   key  — data => identity
 *   view — data => DOM   (the row's rerenderable thunk)
 */
export class KeyedList extends HTMLElement {
    // key -> { node, render } — location/update/remove are O(1), no DOM query.
    #rows = new Map();
    // rowNode -> key — the one DOM→key path, for event delegation (keyAt).
    #keys = new WeakMap();
    // the semantic container the rows live in (memoized from createRoot()).
    #root = null;

    /** @type {(data: any) => any} derives a row's identity. */
    key;
    /** @type {(data: any) => Node} the row's rerenderable thunk. */
    view;

    // The semantic container. Base: the element itself (raw, no wrapper).
    // Leaves override (KeyedUList → <ul>, KeyedTable → <table><tbody>, …).
    createRoot() { return this; }

    get root() { return this.#root ??= this.createRoot(); }

    connectedCallback() {
        const root = this.root; // builds it on first connect
        // Attach the created root once (idempotent — connectedCallback can
        // fire on every insertion). Base's root IS the element: nothing to do.
        if(root !== this && root.parentNode !== this) this.append(root);
    }

    add(...items) { for(const item of items) this.#insert(item); }
    addAll(items) { for(const item of items) this.#insert(item); }

    #insert(data) {
        const key = this.key(data);
        const render = rerenderer(this.view); // one rerenderer instance per row
        const node = render(data);            // first call: builds + caches the node
        this.root.append(node);
        this.#rows.set(key, { node, render });
        this.#keys.set(node, key);
        return node;
    }

    // Re-run that row's rerenderer: same node, rebound with new data (in place).
    update(key, data) {
        const row = this.#rows.get(key);
        if(!row) return null;
        row.render(data);
        return row.node;
    }

    remove(key) {
        const row = this.#rows.get(key);
        if(!row) return;
        this.#keys.delete(row.node);
        row.node.remove();
        this.#rows.delete(key);
    }

    move(key, index) {
        const row = this.#rows.get(key);
        if(!row) return;
        this.root.insertBefore(row.node, this.root.children[index] ?? null);
    }

    clear() {
        for(const { node } of this.#rows.values()) {
            this.#keys.delete(node);
            node.remove();
        }
        this.#rows.clear();
    }

    has(key) { return this.#rows.has(key); }
    get(key) { return this.#rows.get(key)?.node ?? null; }
    get size() { return this.#rows.size; }

    // Delegation: given an event target, the key of the row it's inside.
    keyAt(target) {
        for(let n = target; n && n !== this; n = n.parentNode) {
            if(this.#keys.has(n)) return this.#keys.get(n);
        }
        return undefined;
    }

    *[Symbol.iterator]() {
        for(const [key, { node }] of this.#rows) yield [key, node];
    }
}
