import { DOMRenderer } from './dom-renderer.js';
import { HTMLRenderer } from './html-renderer.js';
import { activeRerenderer } from './rerenderer.js';

export { rerenderer, activeRerenderer } from './rerenderer.js';

const templates = new Map(); // cache
let renderEngine = DOMRenderer; // DOM or HTML engine

export const RenderService = {
    useDOMEngine() {
        renderEngine = DOMRenderer;
        templates.clear();
    },
    useHTMLEngine() {
        renderEngine = HTMLRenderer;
        templates.clear();
    }
};


function get(id, isFragment = false, content) {
    if(templates.has(id)) return templates.get(id);
    const template = renderEngine.createTemplate(id, content, isFragment);
    templates.set(id, template);
    return template;
}

const bindings = new WeakMap(); // cache
// TODO: implement cleanup actions on nodes
export function clearBind(node) {
    if(bindings.has(node)) bindings.delete(node);
}

// stack
const injectable = [];
function pushInject(node) {
    injectable.push(node);
}
function popInjectWithCheck(node) {
    const popped = injectable.pop();
    // when might this happen?
    if(popped !== node) {
        throw new Error('Injectable stack error');
    }
}

// stack
const recordable = [];
function pushRecord() {
    recordable.push(true);
}
function popRecord(node) {
    return recordable.pop();
}

export function renderer(id, targets, makeBind, isFragment, content) {
    const create = get(id, isFragment, content);

    // Per-declaration identity: the rerenderer's cache key. Each
    // renderer() call is one compiled call site (per-site factory
    // declarations) — closure identity IS the key, so deduped templates
    // (same id, multiple sites) cannot collide across sites.
    const siteKey = { id };

    function buildFresh() {
        const [node, boundEls] = create();
        const nodes = targets ? targets(node, boundEls) : null;
        const bind = makeBind ? makeBind(nodes) : null;
        return { node, bind };
    }

    // Legacy injection path (Controller/Updater): a bare node pushed on
    // the injectable stack, bind cached in the module WeakMap. Kept
    // verbatim until blocks migrate onto Rerenderer.
    function getBound() {
        let bind = null;
        let boundEls = null;
        let node = injectable.at(-1); // peek!

        // TODO: test injectable is right template id type

        if(node) {
            const hasBind = bindings.has(node);
            bind = bindings.get(node);
            if(hasBind) return [node, bind];
        }

        if(!create) return [null, null];

        if(node) boundEls = renderEngine.bound(node);
        else {
            // (destructuring re-assignment)
            ([node, boundEls] = create());
        }

        const nodes = targets ? targets(node, boundEls) : null;
        bind = makeBind ? makeBind(nodes) : null;

        bindings.set(node, bind);
        return [node, bind];
    }

    // templateRenderer inlined — the extra HOF layer bought nothing.
    return (...args) => {
        let root = null, bind = null;
        const rr = activeRerenderer();
        if(rr && create) {
            ({ node: root, bind } = rr.getBound(siteKey, buildFresh));
        }
        else {
            ([root, bind] = getBound());
        }
        if(bind) bind(...args);
        return root;
    };
}

export class Controller {
    static for(renderFn) {
        return new this(renderFn);
    }
    constructor(renderFn) {
        this.renderFn = renderFn;
    }
    render(props) {
        return this.renderFn(props);
    }
    update(node, props) {
        pushInject(node);
        this.renderFn(props);
        popInjectWithCheck(node);
    }
}

let record = false;

function update(fn) {
    let hasRendered = false;
    let out = null;

    return function render(props) {
        if(!hasRendered) {
            pushRecord();
            out = fn(props);
            popRecord();
            hasRendered = true;
        }
        else {
            pushInject(out);
            fn(props);
            popInjectWithCheck(out);
        }
        return out;
    };
}

export class Updater extends Controller {
    ref = null;
    render(props) {
        return this.ref ?? (this.ref = super.render(props));
    }
    update(props) {
        this.ref ? super.update(this.ref, props) : this.render(props);
    }
}
