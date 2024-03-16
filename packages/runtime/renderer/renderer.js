
export function makeStringRenderer(id, html, isFragment = false) {
    const template = [];
    for(let i = 0; i < html.length; i++) {
        if(i !== 0) template.push(null);
        template.push(html[i]);
    }

    return () => {
        const root = template.slice();
        const targets = [];
        for(let i = 1; i < root.length; i += 2) {
            targets.push(root[i] = []);
        }
        return [root, targets];
    };
}

export function getStringBound(root) {
    const targets = [];
    for(let i = 1; i < root.length; i += 2) {
        targets.push(root[i] = []);
    }
    return targets;
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

const map = new Map();

// TODO: will evolve once "clean-up" happens
export function clearBind(node) {
    if(map.has(node)) map.delete(node);
}

export function makeTemplate(source, targets, makeBind, getBound) {
    let bind = null;
    let boundEls = null;
    let node = injectable.at(-1); // peek!

    // TODO: test injectable is right template id

    if(node) bind = map.get(node);
    if(bind) return [node, bind];

    // use case would be list component optimize by
    // not keeping bind functions,
    // honestly not sure this really needed, the
    // overhead is small as it is simple function
    if(node) boundEls = getBound(node);
    else {
        // (destructured re-assignment)
        ([node, boundEls] = source());
    }

    const nodes = targets(node, boundEls);
    bind = makeBind(nodes);

    map.set(node, bind);
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