export default class Base {
    
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