'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class Base {
    
    constructor(observable) {
        this._observable = observable;
        this._anchor = null;
        this._topAnchor = null;
        this._subscription = null;
        this._unsubscribes = null;
        
        this.children = null;
    }

    onanchor(anchor) {
        this._anchor = anchor;
        this._topAnchor = anchor.previousSibling;
        this._subscription = this._observable.subscribe(val => this._render(val));
    }

    unsubscribe() {
        this._unrender();
        const { _subscription: subscription } = this;
        subscription && subscription.unsubscribe();
    }

    _insert(node) {
        const { _anchor: anchor } = this;
        anchor.parentNode.insertBefore(node, anchor);
    }

    _unrender() {
        this._removePrior();
        this._unsubscribe();
    }

    _removePrior() {
        const { _anchor: anchor } = this;
        let sibling = this._topAnchor.nextSibling;
        while (sibling && sibling !== anchor) {
            const current = sibling;
            sibling = sibling.nextSibling;
            current.remove();
        }
    }

    _unsubscribe() {
        const { _unsubscribes: unsubscribes } = this;
        if (!unsubscribes) return;

        if (Array.isArray(unsubscribes)) {
            for (let i = 0; i < unsubscribes.length; i++) {
                unsubscribes[i].unsubscribe();
            }
        } else {
            unsubscribes.unsubscribe();
        }
        this._unsubscribes = null;
    }
}

function makeBlock(observable) {
    return new Block(observable);
}

class Block extends Base {

    _render(value) {
        this._unrender();

        const { children: map } = this;
        if (!map) return;

        const fragment = map(value);

        if (Array.isArray(fragment)) {
            const unsubscribes = this._unsubscribes = [];
            for (let i = 0; i < fragment.length; i++) {
                const f = fragment[i];
                if (f.unsubscribe) unsubscribes.push(f);
                if (i !== 0) fragment[0].appendChild(f);
            }
            if (fragment.length) this._insert(fragment[0]);
        } else {
            this._unsubscribes = fragment.unsubscribe ? fragment : null;
            this._insert(fragment);
        }
    }
}

function makeStream(observable) {
    return new Stream(observable);
}

class Stream extends Base {
    
    constructor(observable) {
        super(observable);
        this._unsubscribes = [];
    }

    _unsubscribe() {
        const { _unsubscribes: unsubscribes } = this;
        
        for (let i = 0; i < unsubscribes.length; i++) {
            const unsub = unsubscribes[i];
            unsub.unsubscribe();
        }

        this._unsubscribes = [];
    }

    _render(value) {
        const { children: map } = this;
        if (!map) return;

        const fragment = map(value);
        const { _unsubscribes: unsubscribes } = this;

        if (Array.isArray(fragment)) {
            for (let i = 0; i < fragment.length; i++) {
                const f = fragment[i];
                if (f.unsubscribe) unsubscribes.push(f);
                if (i !== 0) fragment[0].appendChild(f);
            }
            if (fragment.length) this._insert(fragment[0]);
        } else {
            if(fragment.unsubscribe) unsubscribes.push(fragment);
            this._insert(fragment);
        }
    }
}

function renderer(fragment) {

    init(fragment);

    return function render() {
        const clone = fragment.cloneNode(true);
        const nodes = clone.querySelectorAll('[data-bind]');
        nodes[ nodes.length ] = clone;
        return nodes;
    };
}

function init(fragment) {
    const nodes = fragment.querySelectorAll('text-node');
    for(var i = 0, node = nodes[i]; i < nodes.length; node = nodes[++i]) {
        node = nodes[i];
        node.parentNode.replaceChild(document.createTextNode(''), node);
    }
}

function makeFragment(html) {
    return toFragment(makeDiv(html).childNodes);
}

function toFragment(childNodes) {
    const fragment = document.createDocumentFragment();
    
    let node;
    while(node = childNodes[0]) {
        fragment.appendChild(node);
    }

    return fragment;
}

const div = document.createElement('template');
function makeDiv(html) {
    div.innerHTML = html;
    return div.content;
}

function first(observable, subscriber) {
    let any = false;

    const subscription = observable.subscribe(value => {
        subscriber(value);
        if(any) subscription.unsubscribe();
        any = true;
    });

    if(any) subscription.unsubscribe();
    any = true;

    return subscription;
}

function map(observable, map, subscriber, once = false) {
    let last;
    let lastMapped;
    let any = false;

    const subscription = observable.subscribe(value => {
        if(value !== last) {
            last = value;
            const mapped = map(value);
            if(mapped !== lastMapped) {
                lastMapped = mapped;
                subscriber(mapped);
            }
        }
        if(any && once) subscription.unsubscribe();
        any = true;
    });

    if(any && once) subscription.unsubscribe();
    any = true;

    return subscription;
}

function combine(observables, combine, subscriber, once = false) {
    const length = observables.length;
    let values = new Array(length);
    let lastCombined;
    let subscribed = false;
    let any = false;

    const call = () => {
        const combined = combine.apply(null, values);
        if(combined !== lastCombined ) {
            lastCombined = combined;
            subscriber(combined);
        }
    };

    const subscriptions = new Array(length);
    const unsubscribes = once ? [] : null;

    for(let i = 0; i < length; i++) {
        subscriptions[i] = observables[i].subscribe(value => {
            if(value !== values[i]) {
                values[i] = value;
                if(subscribed) call();
            }

            if(once) {
                if(subscribed) subscriptions[i].unsubscribe();
                else unsubscribes.push(i);
            }

            any = true;
        });
    }

    subscribed = true;
    if(any) call();
    if(once) {
        unsubscribes.forEach(i => subscriptions[i].unsubscribe());
    }
    
    return {
        unsubscribe() {
            for(let i = 0; i < length; i++) {
                subscriptions[i].unsubscribe();
            }
        }
    };
}

const isProp = (name, node) => name in node;

function attrBinder(name) {
    return node => {
        return isProp(name, node)
            ? val => node[name] = val
            : val => node.setAttribute(name, val);
    };
}

function textBinder(index) {
    return node => {
        const text = node.childNodes[index];
        return val => text.nodeValue = val;
    };
}

function __blockBinder(index) {
    return node => {
        const anchor = node.childNodes[index];
        const insertBefore = node => anchor.parentNode.insertBefore(node, anchor);

        const top = document.createComment(' block start ');
        insertBefore(top, anchor);
        
        let unsubscribes = null;
        const unsubscribe = () => {
            if(!unsubscribes) return;
            
            if(Array.isArray(unsubscribes)) {
                for(let i = 0; i < unsubscribes.length; i++) {
                    const unsub = unsubscribes[i];
                    if(unsub.unsubscribe) unsub.unsubscribe();
                }
            } else {
                unsubscribes.unsubscribe && unsubscribes.unsubscribe();
            }
            unsubscribes = null;
        };
        
        const observer = val => {
            removePrior(top, anchor);
            unsubscribe();
            if(!val) return;
            
            const fragment = toFragment$1(val);

            if(Array.isArray(fragment)) {
                unsubscribes = [];
                for(let i = 0; i < fragment.length; i++) {
                    const f = fragment[i];
                    if(f.unsubscribe) unsubscribes.push(f.unsubscribe);
                    if(i !== 0) fragment[0].appendChild(f);
                }
                if(fragment.length) insertBefore(fragment[0], anchor);
            } else {
                unsubscribes = fragment.unsubscribe || null;
                insertBefore(fragment, anchor);
            }
        };

        return { observer, unsubscribe };
    };
}

const toFragment$1 = val => typeof val === 'function' ? val() : val;

const removePrior = (top, anchor) => {
    let sibling = top.nextSibling;
    while(sibling && sibling !== anchor) {
        const current = sibling;
        sibling = sibling.nextSibling;
        current.remove();
    }
};

function propBinder(name) {
    return target => val => target[name] = val;
}

function componentBinder(index) {
    return node => {
        return node.childNodes[index];
    };
}

// runtime use:
function _(){}
function $(){}

exports._ = _;
exports.html = _;
exports.$ = $;
exports.Block = makeBlock;
exports.Stream = makeStream;
exports.renderer = renderer;
exports.makeFragment = makeFragment;
exports.__first = first;
exports.__map = map;
exports.__combine = combine;
exports.__attrBinder = attrBinder;
exports.__textBinder = textBinder;
exports.__blockBinder = __blockBinder;
exports.__propBinder = propBinder;
exports.__componentBinder = componentBinder;
