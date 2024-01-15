
export default function renderer(fragment) {

    const nodes = fragment.querySelectorAll('text-node');
    let node = null;
    for(var i = 0; i < nodes.length; node = nodes[++i]) {
        node = nodes[i];
        node.parentNode.replaceChild(document.createTextNode(''), node);
    }

    return function render() {
        const clone = fragment.cloneNode(true);
        return {
            __fragment: clone,
            __nodes: clone.querySelectorAll('[data-bind]')
        };
    };
}

const lookup = {
    set '0'(value) {
        // boundFn(value);
    }
};

class Template { }

function domService(id, templateMap, fragment) {
    const nodes = fragment.querySelectorAll('text-node');
    let node = null;
    for(var i = 0; i < nodes.length; node = nodes[++i]) {
        node = nodes[i];
        node.parentNode.replaceChild(document.createTextNode(''), node);
    }

    // setup Class with 'index' setters based on template Map
    // use reflection? or prebuilt jumbo object?
    return () => {
        const clone = fragment.cloneNode(true);
        const template = new Template(clone);

        return {
            root: clone,
            template,
        };
    };
}

function textService(id, templateMap, renderers, fragment) {
    const renderer = renderers.get(id);

    // build array of indexes by templateMap

    // setup Class
    return (node = fragment.cloneNode(true)) => {
        return {
            root: node,
            template: new Template(node),
        };
    };
}

let t = [
    ['hello', '*', 'world'],
    ['<ul>', [], '</ul>']
];

const subs = { createFor() { } };

const iconMode = 'stylish', version = '2.0';
(({ emoji, x, y, z }) => {
    // _`<p>{~emoji.name}: {~emoji.text}</p>`;
    const renderTree = domService(`c1d46e`, 'map');
    return () => {
        const { root, bind } = renderTree();

        // initial render
        bind[1](iconMode);
        bind[3](version);

        const bind4 = bind[4];
        const bind5 = bind[5];
        // subscriptions
        const register = subs.createFor(root);

        const bind0 = bind[0];
        const bind2 = bind[2];
        // 1 signal used in multiple binders
        register(emoji.subscribe(emoji => {
            bind0(emoji.name);
            bind2(emoji.text);
        }));

        // expressions with more than one signal
        let __x, __y, __z;
        const b1 = (x, y) => bind4(/*{*/ x / y /*}*/);
        const b2 = (x, z) => bind5(/*{*/ x < z /*}*/);

        register(x.subscribe(v => { b1(__x = v, y), b2(v); }, bind4, bind5));
        register(y.subscribe(v => { b1(x, __y = v); }, bind4));
        register(z.subscribe(v => { b1(x, __z = v); }, bind5));

        return root;
    };
})();

(({ emoji, x, y, z }) => {
    const renderTree = domService(`c1d46e`, 'map');
    return () => {
        const { root, bind } = renderTree();

        // initial render
        bind[1](iconMode);
        bind[3](version);

        const bind4 = bind[4];
        const bind5 = bind[5];
        // subscriptions
        const register = subs.createFor(root);

        const bind0 = bind[0];
        const bind2 = bind[2];
        // 1 signal used in multiple binders
        register(emoji.subscribe(emoji => {
            bind0(emoji.name), bind2(emoji.text);
        }));

        // expressions with more than one signal
        let __x, __y, __z;
        const b1 = (x, y) => bind4(/*{*/ x / y /*}*/);
        const b2 = (x, z) => bind5(/*{*/ x < z /*}*/);

        register(x.subscribe(v => { b1(__x = v, y), b2(v); }, bind4, bind5));
        register(y.subscribe(v => { b1(x, __y = v); }, bind4));
        register(z.subscribe(v => { b1(x, __z = v); }, bind5));

        return root;
    };
})();