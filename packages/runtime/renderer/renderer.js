import { DOMRenderEngine } from './renderer.dom.js';
import { HTMLRenderEngine } from './renderer.html.js';

let renderEngine = DOMRenderEngine;
export const RenderService = {
    useDOMEngine() {
        renderEngine = DOMRenderEngine;
    },
    useHTMLEngine() {
        renderEngine = HTMLRenderEngine;
    },
    clear,
    get,
    bound,
};

const templates = new Map();
function clear() {
    templates.clear();
}

export function get(id, isFragment = false, html = '') {
    if(templates.has(id)) return templates.get(id);

    let node = html ? renderEngine.make(html) : renderEngine.get(id);
    const render = renderEngine.renderer(node, isFragment);

    templates.set(id, render);
    return render;
}

export function bound(node) {
    return renderEngine.bound(node);
}

const bindings = new Map();

// TODO: impl cleanup actions on nodes
export function clearBind(node) {
    if(bindings.has(node)) bindings.delete(node);
}

// stack
const injectable = [];
export function inject(node, callback) {
    injectable.push(node);
    callback();
    const popped = injectable.pop();
    if(popped !== node) {
        // TODO: display html like object for compose
        throw new Error('Injectable stack error');
    }
}

export function makeTemplate(source, targets, makeBind) {
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