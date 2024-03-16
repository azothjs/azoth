const templates = new Map();

export function clearTemplates() {
    templates.clear();
}

export function makeStringRenderer(id, html, isFragment = false) {
    return () => {
        const root = [];
        const targets = [];
        for(let i = 0; i < html.length; i++) {
            root.push(html[i]);
            if(i === html.length - 1) break;
            const target = [];
            targets.push(target);
            root.push(target);
        }
        return [root, targets];
    };
}

export function makeRenderer(id, html, isFragment = false) {
    if(templates.has(id)) return templates.get(id);

    const template = document.createElement('template');
    template.innerHTML = html;
    return rendererFactory(id, template.content, isFragment);
}

export function rendererById(id, isFragment = false) {
    if(templates.has(id)) return templates.get(id);

    const templateEl = document.getElementById(id);
    if(!templateEl) {
        throw new Error(`No template with id "${id}"`);
    }

    return rendererFactory(id, templateEl.content, isFragment);
}

function rendererFactory(id, node, isFragment) {
    const render = renderer(node, isFragment);
    templates.set(id, render);
    return render;
}

const QUERY_SELECTOR = '[data-bind]';

function renderer(fragment, isFragment) {
    if(!isFragment) fragment = fragment.firstElementChild;
    // TODO: malformed fragments...necessary?

    return function render() {
        const clone = fragment.cloneNode(true);
        const targets = clone.querySelectorAll(QUERY_SELECTOR);
        return [clone, targets];
    };
}

export function getBoundElements(dom) {
    return dom.querySelectorAll(QUERY_SELECTOR);
}



const map = new Map();


export const injectable = [];
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
    let node = injectable.at(-1); // peek!
    // TODO: test injectable is right template id

    if(node) bind = map.get(node);
    if(!bind) {
        const result = node
            ? [node, getBoundElements(node)]
            : source();
        node = result[0];
        const nodes = targets(node, result[1]);
        bind = makeBind(nodes);
        map.set(node, bind);
    }

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
    #dom = null;
    render(props) {
        return this.#dom = super.render(props);
    }
    update(props) {
        super.update(this.#dom, props);
    }
}