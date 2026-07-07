import { activeRenderer } from '../renderer/rerenderer.js';

export const IGNORE = Symbol.for('azoth.compose.IGNORE');

/**
 * @typedef {Object} Input
 * The explicit form of a compose input — "seed this slot, then drive it from a
 * source." Recognized structurally by `from`, so a bare object literal is
 * first-class and Channel is just one implementer. (`source` is what flows into
 * a Channel upstream; `from` is where compose draws the input from.)
 * @property {*} [initial] Seed composed immediately — a loading view, etc.
 * @property {Promise<*> | AsyncIterable<*>} from The source whose value(s)
 *   replace the seed: a Promise (resolves once) or an async iterable (each value
 *   replaces, or accumulates with `append`).
 * @property {boolean} [append] When true, the first source value replaces the
 *   seed and subsequent values accumulate; otherwise each replaces the prior.
 */
export function compose(anchor, input, keep) {
    if(keep !== true) keep = false;

    // The identical value at an anchor is one instruction, not two.
    // Only consulted during a synchronous rerender pass (async
    // continuations run after the pass — stack empty, no skip), and
    // only on the replace path: keep=true means accumulate, where
    // a repeated value is a legitimate "add another."
    if(!keep) {
        const rr = activeRenderer();
        if(rr && rr.skipIfSame(anchor, input)) return;
    }

    const type = typeof input;

    switch(true) {
        case input === IGNORE:
            break;
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            if(!keep) clear(anchor);
            break;
        case type === 'number':
        case type === 'bigint':
            input = `${input}`;
        // eslint-disable-next-line no-fallthrough
        case type === 'string':
            replace(anchor, input, keep);
            break;
        case input instanceof Node:
            replace(anchor, input, keep);
            break;
        case type === 'function': {
            // will throw if function is class,
            // unlike create or compose element.
            // Called with no args: props/childNodes intake is component
            // territory (create/composeComponent) — a slot function is a
            // deferred value, not a component.
            let out = input();
            compose(anchor, out, keep);
            break;
        }
        case type !== 'object': {
            // ES2023: Symbol should be only type  
            throwTypeError(input, type);
            break;
        }
        case input instanceof Promise:
            composePromise(anchor, input, keep);
            break;
        case Array.isArray(input):
            composeArray(anchor, input, keep);
            break;
        // Covers async generators, modern ReadableStream (implements
        // [Symbol.asyncIterator]), and any other AsyncIterable. One rule for
        // every async sequence: each value replaces; accumulation is opt-in
        // upstream (Channel/Input `append`).
        //
        // The !! is required semantics, not a workaround: switch(true) is a
        // strict-equality match, and `true === <the asyncIterator function>`
        // is never true. Every case here must be an actual boolean.
        case !!input[Symbol.asyncIterator]:
            composeAsyncIterator(anchor, input, keep);
            break;
        case typeof input?.render === 'function':
            // Drive a UIComponent to DOM. Intake (props/childNodes) happened
            // at construction; render() takes no args. The change channel is
            // update(), not re-render — see composeComponent.
            compose(anchor, input.render(), keep);
            break;
        case typeof input.subscribe === 'function':
            composeObservable(anchor, input, keep);
            break;
        // Input — { initial?, from, append? }: the explicit "seed this slot,
        // then drive it from a source" shape. `from` is where the input comes
        // from (a Channel, a bare literal, …). compose recognizes the SHAPE,
        // not any class — it no longer imports Channel. Placed after
        // render/subscribe so those more specific shapes win.
        case 'from' in input: {
            compose(anchor, input.initial, keep);
            const { from, append } = input;
            if(from === undefined || from === null) break;   // seed only
            if(from instanceof Promise) {
                // Single value replaces the seed; `append` is moot (one value).
                composePromise(anchor, from, false);
                break;
            }
            // Async iterable — with `append`, firstReplaces clears the seed on
            // the first value, then subsequent values accumulate.
            composeAsyncIterator(anchor, from, append, append);
            break;
        }
        default: {
            throwTypeErrorForObject(input);
        }
    }
}

/**
 * @typedef {Object} UIComponent
 * The base imperative-update protocol compose() drives in component position —
 * any object, class, or function of this shape, no base class to extend.
 * compose()/Composable cares ONLY about this base (render + update); the
 * create()/`<C/>` intake hook lives on the fuller {@link Component}.
 * @property {() => *} render First paint — no args; intake already happened.
 * @property {(props: object, childNodes?: *) => (*|void)} update A prop changed:
 *   return new DOM to replace, or void to adapt in place. (Channel implements
 *   update-only — no render.)
 */

/**
 * @typedef {UIComponent & { initialize?: (props: object, childNodes?: *) => void }} Component
 * A create()/`<C/>` component — a {@link UIComponent} plus the optional one-time
 * `initialize` intake (props/childNodes), run once before the first render.
 * create() drives the full lifecycle (initialize → render → update); compose()
 * in a slot drives only the UIComponent base. (initialize is optional because
 * create calls it as `initialize?.()` — a base UIComponent is a valid create
 * input too.)
 */
export function composeComponent(anchor, [Constructor, props, childNodes]) {
    const rr = activeRenderer();
    if(rr) {
        // The update verb. Same Constructor at this anchor → update in
        // place. Different Constructor → fall through to create (=== fails
        // downstream → ordinary replace).
        const memo = rr.getComponent(anchor);
        if(memo && memo.Constructor === Constructor) {
            // Updatable instance: the instance IS the update surface.
            // update() is the change channel — undefined means it kept its
            // own DOM (a UIComponent drove in place, or a Channel left its
            // live subscription running); a Composable return replaces. When
            // that return is itself an updatable instance (a Channel handing
            // back its post-switch replacement), it becomes the new cache.
            if(memo.instance) {
                const out = memo.instance.update(props, childNodes);
                if(out !== undefined) {
                    if(out !== memo.instance && isUpdatable(out)) {
                        rr.setComponent(anchor, { Constructor, instance: out });
                    }
                    paint(anchor, out);
                }
                return;
            }
            // Function chain: re-invoke the cached last link.
            if(memo.updater) {
                const { out, last } = walkChain(memo.updater(props, childNodes), props, childNodes);
                if(last) memo.updater = last; // chain extended — track the new end
                compose(anchor, out);
                return;
            }
        }

        const created = create(Constructor, props, childNodes);
        const { out, last } = walkChain(created, props, childNodes);
        // An updatable instance (has update()) caches for the update verb:
        // UIComponents (render+update) and Channel (update, no render —
        // recognized by compose). Everything else caches its chain end:
        // plain functions re-call (setup re-fires — the documented cost),
        // constructibles without update() re-construct.
        if(isUpdatable(out)) {
            rr.setComponent(anchor, { Constructor, instance: out });
            paint(anchor, out);
        }
        else {
            rr.setComponent(anchor, { Constructor, updater: last ?? callableFor(Constructor) });
            compose(anchor, out);
        }
        return;
    }

    createCompose(Constructor, props, childNodes, anchor);
}

// First paint of a cached instance. A UIComponent renders (no args — intake
// already happened; the node is tracked for the === skip). Anything else
// updatable (a Channel) composes directly, so compose's own dispatch drives
// it — for Channel that's the `instanceof Channel` branch (initial + source).
function paint(anchor, instance) {
    compose(anchor, typeof instance.render === 'function' ? instance.render() : instance);
}

// Has an update() change channel → cache the instance for the update verb.
// Covers UIComponents (render+update) and Channel (update only).
function isUpdatable(value) {
    return value !== null
        && typeof value === 'object'
        && typeof value.update === 'function';
}

// The chain rule: keep calling function results until something
// composable comes out; report the last callable link (the cached
// update object) and the composable.
function walkChain(current, props, childNodes) {
    let last = null;
    while(typeof current === 'function') {
        last = current;
        current = current(props, childNodes) ?? null;
    }
    return { out: current, last };
}

function callableFor(input) {
    if(typeof input !== 'function') return null;
    return input.prototype?.constructor
        // eslint-disable-next-line new-cap
        ? (props, childNodes) => new input(props, childNodes)
        : input;
}

export function createCompose(Constructor, props, childNodes, anchor) {
    const out = create(Constructor, props, childNodes);
    if(out !== anchor) compose(anchor, out);
}

export function createComponent(Constructor, props, childNodes) {
    let result = create(Constructor, props, childNodes);

    switch(typeof result) {
        case 'number':
        case 'bigint':
            result = `${result}`;
        // eslint-disable-next-line no-fallthrough
        case 'string':
            return document.createTextNode(result);
        default:
            return result;
    }
}

// Component position eats clean; interpolators are the gourmands.
// create() accepts: function | class | object-with-render (UIComponent
// shape) | null/undefined (no-op — dynamic <C/> where C is conditionally
// null renders nothing). Everything else throws.
function create(input, props, childNodes) {
    const type = typeof input;

    switch(true) {
        // Reject Node-as-component. This was the residue of the removed
        // DOM-overlay (skinning) path: the Object.assign went, the
        // passthrough lingered. Component invocation means "construct" —
        // create needs to actually produce something. A pre-built Node is
        // a VALUE: interpolate it ({node}), don't invoke it (<Node/>).
        case input instanceof Node:
            throw new TypeError(
                `Cannot use a DOM Node as a component. ` +
                `Components construct DOM; a pre-built Node is a value. ` +
                `Interpolate it instead: {node} rather than <Node/>.`
            );
        // Only null/undefined are component no-ops (conditional patterns:
        // `cond ? Cat : null`). Booleans, '', and IGNORE fall through to
        // the rejection cases — they're slot vocabulary, not components.
        case input === undefined:
        case input === null:
            return null;
        // Function: invoke with props/childNodes.
        case !!(input.prototype?.constructor): {
            // class and function(){} — invoked with `new`
            // eslint-disable-next-line new-cap
            return new input(props, childNodes);
        }
        case type === 'function': {
            // arrow () => {} — called directly
            return input(props, childNodes) ?? null;
        }
        // Reject primitive-as-component. Strings, numbers, bigints,
        // booleans in component position are almost always a mistake.
        case type === 'string':
        case type === 'number':
        case type === 'bigint':
        case type === 'symbol':
        case type === 'boolean':
            throwPrimitiveAsComponent(input, type);
            break;
        case type !== 'object': {
            throwTypeError(input, type);
            break;
        }
        case typeof input?.render === 'function':
            // Pre-constructed instance (object literal). Intake via
            // initialize — the literal's constructor moment. Construction
            // PRESERVES the instance (so `const c = <C/>` keeps it, and a
            // component's non-DOM Composable return survives); compose
            // drives render() to DOM later, when position demands it.
            input.initialize?.(props, childNodes);
            return input;
        default: {
            // The former default-label container dance (Promise, async
            // iterable, Array in component position) was removed. Lazy
            // components are async functions:
            //   async function Lazy(props) {
            //       const { Cat } = await import('./cat.js');
            //       return createComponent(Cat, props);
            //   }
            // Anything async arrives as a RETURN VALUE, where compose
            // already handles it. Values belong in slots: {value}.
            throwTypeErrorForObject(input);
        }
    }
}

/* async source teardown

   A live source (async-iterator, stream, observable, promise) registers a
   cancel keyed by its anchor comment; clear(anchor) invokes it. So replacing an
   anchor's content — case 2, a content swap — tears the previous source down. A
   higher "block swap" never calls this clear, so a source in a swapped-away
   block stays live (author's choice / MutationObserver). One source per anchor:
   a new subscribe supersedes the prior. Bare sources are otherwise fire-and-
   forget; Channel layers its own switch-abort on top (see channel.js). */

const subscriptions = new WeakMap();   // anchor comment → cancel()

// The source whose value is currently being composed. A clear() fired DURING a
// source composing its OWN value must NOT cancel that source — only a clear
// from OUTSIDE it (a different source, or a plain value taking over) tears it
// down. This reentrancy guard lets a driving source (an outer async iterator)
// and the content source it yields (an inner one) share an anchor.
let currentSource = null;

function subscribe(anchor, cancel) {
    subscriptions.set(anchor, cancel);
}

// A source that ends on its own clears only ITS registration — a newer source
// may have superseded it (=== guard).
function settled(anchor, cancel) {
    if(subscriptions.get(anchor) === cancel) subscriptions.delete(anchor);
}

// Resolves to ABORTED when the signal fires, raced against a pull so clear()
// interrupts a parked await. (Duplicates channel's aborted() for now —
// working code both places; collapse in refinement if the shape holds.)
const ABORTED = Symbol('compose.aborted');
function aborted(signal) {
    return new Promise(resolve => {
        if(signal.aborted) resolve(ABORTED);
        else signal.addEventListener('abort', () => resolve(ABORTED), { once: true });
    });
}

/* replace and clear */

function replace(anchor, input, keep) {
    if(!keep) clear(anchor);
    // A DocumentFragment inserts childNodes.length nodes (and empties
    // itself); everything else inserts one. The anchor's count must match
    // what the slot actually owns, or a later clear() strands the
    // difference. (Probe-confirmed: compose.clear.test.js.)
    const count = input instanceof DocumentFragment ? input.childNodes.length : 1;
    anchor.before(input);
    anchor.data = +anchor.data + count;
}

function clear(anchor) {
    // Cancel a live source feeding this anchor before removing its nodes — a
    // content swap, or a plain value replacing an async source, tears it down.
    // But NOT when the source is composing its OWN value (currentSource): that
    // clear is self-triggered (updating in place), not a takeover.
    const cancel = subscriptions.get(anchor);
    if(cancel && cancel !== currentSource) { subscriptions.delete(anchor); cancel(); }

    let node = anchor;
    let count = +anchor.data;

    // TODO: validate count received

    while(count--) {
        const { previousSibling } = node;
        if(!previousSibling) break;

        // TODO: how to guard for azoth comments only?
        if(previousSibling.nodeType === Node.COMMENT_NODE) {
            clear(previousSibling);
        }

        previousSibling.remove();
    }

    anchor.data = 0;
}

/* complex types */

function composeArray(anchor, array, keep) {
    if(!keep) clear(anchor);
    // TODO: optimize arrays here if Node[] research shows gain.
    // vanillajs-1 in jsperf benchmarks has specific numbers
    for(let i = 0; i < array.length; i++) {
        compose(anchor, array[i], true);
    }
}

async function composeAsyncIterator(anchor, iterator, keep, firstReplaces = false) {
    // `firstReplaces` is set by the Input/Channel branch when `append` is true:
    // the first iteration overrides keep to false so it clears the initial
    // render; subsequent iterations honor keep (true → accumulate). Non-Input
    // callers default it to false (behavior unchanged).
    //
    // Cancellable: register an abort keyed by the anchor. clear(anchor) fires
    // it, so a content swap tears this pull down (and the source's own
    // it.return() cleanup runs). The abort is RACED against each pull so a
    // clear interrupts a parked await; the abandoned next() is left to settle.
    const controller = new AbortController();
    const { signal } = controller;
    const cancel = () => controller.abort();
    subscribe(anchor, cancel);

    const it = iterator[Symbol.asyncIterator]();
    const stop = aborted(signal);
    let first = true;
    try {
        while(!signal.aborted) {
            const next = await Promise.race([it.next(), stop]);
            if(next === ABORTED || signal.aborted) break;
            const { value, done } = next;
            if(done) break;
            const effective = (first && firstReplaces) ? false : keep;
            const prev = currentSource;
            currentSource = cancel;
            try { compose(anchor, value, effective); }
            finally { currentSource = prev; }
            first = false;
        }
    }
    finally {
        it.return?.();
        settled(anchor, cancel);
    }
}

// A promise can't be aborted, only ignored: register a live-flag so a swap
// (clear) neutralizes a still-pending result before it can compose. The
// currentSource guard keeps the resolve's own clear from cancelling it.
function composePromise(anchor, promise, keep) {
    let live = true;
    const cancel = () => { live = false; };
    subscribe(anchor, cancel);
    promise.then(value => {
        if(live) {
            const prev = currentSource;
            currentSource = cancel;
            try { compose(anchor, value, keep); }
            finally { currentSource = prev; }
        }
        settled(anchor, cancel);
    });
}

// Observable (TC39 / RxJS-compatible). Each `next` flows through compose; errors
// re-throw (unhandled, like a raw async iterator throwing here); complete is a
// no-op — the slot keeps its last value (use <Channel error={...}> for handled
// errors). Teardown: unsubscribe on clear.
function composeObservable(anchor, observable, keep) {
    let subscription;
    const cancel = () => {
        if(typeof subscription === 'function') subscription();
        else subscription?.unsubscribe?.();
    };
    subscribe(anchor, cancel);
    subscription = observable.subscribe({
        next(value) {
            const prev = currentSource;
            currentSource = cancel;
            try { compose(anchor, value, keep); }
            finally { currentSource = prev; }
        },
        error(err) { throw err; },
        complete() { settled(anchor, cancel); }
    });
}

/* thrown errors */

function throwTypeError(input, type, footer = '') {
    // Passing Symbol to `{...}` throws!
    if(type === 'symbol') input = 'Symbol';
    throw new TypeError(`\
Invalid compose {...} input type "${type}", value ${input}.\
${footer}`
    );
}

function throwPrimitiveAsComponent(input, type) {
    const display = type === 'symbol' ? 'Symbol' : JSON.stringify(input);
    throw new TypeError(
        `Cannot use ${type} (${display}) as a component. ` +
        `Components must be functions, classes, or objects with a render() method. ` +
        `If you want to render a primitive value, interpolate it directly: {value} instead of <Value/>.`
    );
}

function throwTypeErrorForObject(obj) {
    let message = '';
    try {
        const fnName = obj.constructor?.name;
        if(fnName === 'Object') {
            message += `\n\nDid you mean to include a "render" method?`;
        }
        else if(fnName) {
            message += `\n\nDid you forget to return a value from "${fnName}"\
if a function, or a "render" method if a class?`;
        }
        const json = JSON.stringify(obj, null, 2);
        message += `\n\nReceived as:\n\n${json}\n\n`;
    }
    catch(ex) {
        /* no-op */
    }
    throwTypeError(obj, 'object', message);
}
