import { DOMRenderer } from './renderer.dom.js';
import { HTMLRenderer } from './renderer.html.js';

const templates = new Map(); // cache
let renderEngine = DOMRenderer; // DOM or HTML engine

// TODO: Class !!!!!

export const RenderService = {
    useDOMEngine() {
        renderEngine = DOMRenderer;
        clear();
    },
    useHTMLEngine() {
        renderEngine = HTMLRenderer;
        clear();
    },
    get,
    bound,
};

function clear() {
    templates.clear();
}

function get(id, isFragment = false, content) {
    if(templates.has(id)) return templates.get(id);

    const node = content ? renderEngine.make(content) : renderEngine.get(id);
    const render = renderEngine.renderer(node, isFragment);

    templates.set(id, render);
    return render;
}

function bound(node) {
    return renderEngine.bound(node);
}

const bindings = new Map(); // cache
// TODO: implement cleanup actions on nodes
export function clearBind(node) {
    if(bindings.has(node)) bindings.delete(node);
}

// stack
const injectable = [];
function inject(node, callback) {
    injectable.push(node);
    callback();
    const popped = injectable.pop();
    if(popped !== node) {
        // TODO: display html like object for compose
        throw new Error('Injectable stack error');
    }
}

export function render(id, targets, makeBind, isFragment, content) {
    let source = get(id, isFragment, content);
    let bind = null;
    let boundEls = null;
    let node = injectable.at(-1); // peek!

    // TODO: test injectable is right template id type

    if(node) bind = bindings.get(node);
    if(bind) return [node, bind];

    // use case would be list component optimize by
    // not keeping bind functions,
    // honestly not sure this really needed, the
    // overhead is small as it is simple function
    if(node) boundEls = renderEngine.bound(node);
    else {
        // (destructured re-assignment)
        ([node, boundEls] = source());
    }

    const nodes = targets(node, boundEls);
    bind = makeBind(nodes);

    bindings.set(node, bind);
    return [node, bind];
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
        inject(node, () => this.renderFn(props));
    }
}

export class Updater extends Controller {
    #node = null;
    render(props) {
        return this.#node = super.render(props);
    }
    update(props) {
        super.update(this.#node, props);
    }
}