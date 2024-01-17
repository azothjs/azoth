
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

        const binder4 = bind[4];
        const binder5 = bind[5];
        // subscriptions
        const register = subs.createFor(root);

        const binder0 = bind[0];
        const binder2 = bind[2];
        // 1 signal used in multiple binders
        register(emoji.subscribe(emoji => {
            binder0(emoji.name);
            binder2(emoji.text);
        }));

        // expressions with more than one signal
        let __x, __y, __z;
        const b1 = (x, y) => binder4(/*{*/ x / y /*}*/);
        const b2 = (x, z) => binder5(/*{*/ x < z /*}*/);

        register(x.subscribe(v => { b1(__x = v, y), b2(v); }, binder4, binder5));
        register(y.subscribe(v => { b1(x, __y = v); }, binder4));
        register(z.subscribe(v => { b1(x, __z = v); }, binder5));

        return root;
    };
})();


const map = (bindings) => {
    return class MapClass {
        constructor(nodeList) {
            this.n1 = nodeList[0]
            this.n2 = nodeList[1].childNodes[0];
            this.n3 = nodeList[1].childNodes[1];
        }

        '0'(value) {
            this.n1.className = value;
        }

        '1'(value) {
            this.n2.data = value;
        }

        '2'(value) {
            this.n3.data = value;
        }
    }
}

(({ emoji, x, y, z }) => {
    const renderTree = domService(`c1d46e`, 'map');

    const map = [
        /*0*/    new PropertyBinder(0, 'className'),
        /*1*/    new ChildNodeBinder(0, 0, 1),
        /*2*/    { query: 0, index: 0, length: 2, type: '', }
        /*3*/    { query: 0, index: 0, length: 1, type: '', }
        /*4*/    { query: 0, index: 1, length: 5, type: '', }
        /*5*/    { query: 0, index: 3, length: 5, type: '', }
        /*6*/    { query: 0, property: 'className', type: '', }
        /*7*/    { query: 0, index: 7, length: 9, type: '', }
        /*8*/    { query: 0, index: 9, length: 11, type: '', }
    ]

    function bind(b0, b1, b2, b3, b4, b5) {
        // initial render
        b1(iconMode);
        b3(version);
        // expressions with more than one signal
        let __x, __y, __z;
        const b4 = binders[4], b5 = binders[5]
        const b_4 = (x, y) => b4(x / y);
        const b_5 = (x, z) => b5(x < z);

        return [
            // signal used in multiple binders
            (emoji.subscribe ?? emoji.on)(emoji => { b0(emoji.name); b2(emoji.text); }),
            (x.subscribe ?? x.on)(v => { b_4(__x = v, __y); b_5(__x, __z); b6(__x); }),
            (y.subscribe ?? x.on)(v => { b_4(x, __y = v); }),
            (z.subscribe ?? x.on)(v => { b_4(x, __z = v); }),
        ];
    }

    return domService(`c1d46e`, map, bind);

})();

(({ emoji, x, y, z }) => {

    function bind(b0, b1, b2, b3, b4, b5) {
        // initial render
        b1(iconMode);
        b3(version);
        // expressions with more than one signal
        let __x, __y, __z;
        const b4 = binders[4], b5 = binders[5]
        const b_4 = (x, y) => b4(x / y);
        const b_5 = (x, z) => b5(x < z);

        return [
            // signal used in multiple binders
            (emoji.subscribe ?? emoji.on)(emoji => { b0(emoji.name); b2(emoji.text); }),
            (x.subscribe ?? x.on)(v => { b_4(__x = v, __y); b_5(__x, __z); b6(__x); }),
            (y.subscribe ?? x.on)(v => { b_4(x, __y = v); }),
            (z.subscribe ?? x.on)(v => { b_4(x, __z = v); }),
        ];
    }

    return domService(`c1d46e`, map, bind);

})();