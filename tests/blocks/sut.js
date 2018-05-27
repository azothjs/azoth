export default class Block {

    constructor({ anchor = null, map = null } = {}) {
        this.map = map;
        
        this._anchor = null;
        this._topAnchor = null;
        this.anchor = anchor;

        this._unsubscribes = null;
        this.unsubscribed = false;
    }

    set anchor(anchor) {
        this._anchor = anchor;
        this._topAnchor = anchor.previousSibling;
    }

    _trackUnsubscribe({ unsubscribe }) {
        if(unsubscribe === undefined) return;
        if(this._unsubscribes === null) this._unsubscribes = unsubscribe;
        else if(Array.isArray(this._unsubscribes)) this._unsubscribes.push(unsubscribe);
        else this._unsubscribes = [this._unsubscribes, unsubscribe];
    }

    add(item) {
        const { map } = this;
        if(!map) return; //TODO: warn, throw, ???
        
        // TODO: "get DOM" via function, array, etc.
        const dom = map(item);
        this._trackUnsubscribe(dom);
        this._anchor.parentNode.insertBefore(dom, this._anchor);
    }

    removeByIndex(index) {
        this._anchor.parentNode.childNodes[index].remove();
    }

    unsubscribe() {
        const { _unsubscribes: unsubscribes } = this;
        if(unsubscribes === null) return;
        this._unsubscribes = null;

        if(Array.isArray(unsubscribes)) {
            for(let i = 0; i < unsubscribes.length; i++) unsubscribes[i]();
        }
        else {
            unsubscribes();
        }
    }

    clear() {
        const { _anchor: anchor, _topAnchor: top } = this;
        let sibling = anchor.previousSibling;
        while (sibling && sibling !== top) {
            const current = sibling;
            sibling = sibling.previousSibling;
            current.remove();
        }
    }
}