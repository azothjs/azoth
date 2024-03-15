import { test } from 'vitest';
import { compose } from '../compose/compose.js';
import { makeRenderer, getBoundElements } from './renderer.js';

// template generated artifacts
const source = makeRenderer('id', `<p data-bind><!--0--></p>`);

let injectableRoot = null;
function injectRender(dom, callback) {
    injectableRoot = dom;
    callback();
    injectableRoot = null;
}

function getBindTargets(r, boundEls) {
    return [r.childNodes[0]];
}
const makeBind = targets => {
    const t0 = targets[0];
    return p0 => {
        compose(t0, p0);
    };
};

const map = new Map();

const makeTemplate = (source) => {
    let bind = null;
    let root = injectableRoot;
    // TODO: test injectable is right template id

    if(root) bind = map.get(root);
    if(!bind) {
        const result = root
            ? [root, getBoundElements(root)]
            : source();
        root = result[0];
        const nodes = getBindTargets(root, result[1]);
        bind = makeBind(nodes);
        map.set(root, bind);
    }

    return [root, bind];
};

function render123(p0) {
    const [root, bind] = makeTemplate(source);
    bind(p0);
    return root;
}

class Controller {
    static for(renderFn) {
        return new this(renderFn);
    }
    constructor(renderFn) {
        this.renderFn = renderFn;
    }
    render(props) {
        return this.renderFn(props);
    }
    update(dom, props) {
        injectRender(dom, () => this.renderFn(props));
    }
}

class Updater extends Controller {
    #dom = null;
    render(props) {
        return this.#dom = super.render(props);
    }
    update(props) {
        super.update(this.#dom, props);
    }
}

test('controller creates or injects', ({ expect }) => {
    const controller = Controller.for(name => render123(name));

    let dom1 = controller.render('felix');
    let dom2 = controller.render('duchess');
    expect(dom1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">felix<!--1--></p>"`);
    expect(dom2.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">duchess<!--1--></p>"`);

    controller.update(dom1, 'garfield');
    controller.update(dom2, 'stimpy');
    expect(dom1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">garfield<!--1--></p>"`);
    expect(dom2.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">stimpy<!--1--></p>"`);
});

test('update remembers dom', ({ expect }) => {
    const updater = Updater.for(name => render123(name));
    const dom = updater.render('felix');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">felix<!--1--></p>"`);

    updater.update('duchess');
    expect(dom.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">duchess<!--1--></p>"`);
});
