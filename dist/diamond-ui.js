'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function renderer( fragment ) {
    
    init( fragment );
    
    return function render() {
        const clone = fragment.cloneNode(true);
        const nodes = clone.querySelectorAll('[data-bind]');
        nodes[ nodes.length ] = clone;
        return nodes;
    };
}

const replace = {
    'text-node': () => document.createTextNode( '' ),
    'block-node': () => document.createComment( 'block' )
};

const query = Object.keys( replace ).join();

function init( fragment ) {

    const nodes = fragment.querySelectorAll( query );
    
    let  node = null, newNode = null;
    
    for( var i = 0, l = nodes.length; i < l; i++ ) {
        node = nodes[i];
        newNode = replace[ node.localName ]( node );
        node.parentNode.replaceChild( newNode, node );
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

const div = document.createElement('div');
function makeDiv(html) {
    div.innerHTML = html;
    return div;
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

function __blockBinder( index ) {
    return node => {
        const anchor = node.childNodes[ index ];
        const insertBefore = node => anchor.parentNode.insertBefore(node, anchor);

        // TODO: pass in block observe status so we know not to do this work if possible 
        // insert a top and iterate till anchor to remove
        const top = document.createComment('block start');
        insertBefore(top, anchor);
        
        return val => {
            removePrior(top, anchor);
            const fragment = toFragment$1(val);
            Array.isArray(fragment) ? fragment.forEach(f => insertBefore(f, anchor)) : insertBefore(fragment, anchor);
        };
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

// runtime use:
function _(){}
function $(){}

exports._ = _;
exports.html = _;
exports.$ = $;
exports.renderer = renderer;
exports.makeFragment = makeFragment;
exports.__first = first;
exports.__map = map;
exports.__combine = combine;
exports.__attrBinder = attrBinder;
exports.__textBinder = textBinder;
exports.__blockBinder = __blockBinder;
