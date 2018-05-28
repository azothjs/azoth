
const throwNoDOM = val => {
    throw new Error(`Expected DOM Node but got ${typeof val}:${val}`);
};

const throwNoAnchor = () => {
    throw new Error('Block does not have an anchor set');
};

export default class Block {

    constructor({ anchor = null, map = null } = {}) {
        this.map = map;
        this._anchor = null;
        
        //clear
        this._topAnchor = null;
        
        if(anchor) this.anchor = anchor;

        // observable add, clear
        this._unsubscribes = null;
        this.unsubscribed = false;

        // remove
        this._blocks = [];
    }

    set anchor(anchor) {
        if(!anchor || !(anchor instanceof Node)) throwNoDOM(anchor);
        this._anchor = anchor;
        this._topAnchor = anchor.previousSibling;
    }

    // add, clear
    _trackUnsubscribe({ unsubscribe }) {
        if(unsubscribe === undefined) return;
        if(this._unsubscribes === null) this._unsubscribes = unsubscribe;
        else if(Array.isArray(this._unsubscribes)) this._unsubscribes.push(unsubscribe);
        else this._unsubscribes = [this._unsubscribes, unsubscribe];
    }

    // remove
    _trackDOM(nodes) {
        return this._blocks.push(nodes);  
    }

    add(item) {
        const { map } = this;
        if(!map) return; //TODO: warn, throw, ???
        // track DOM via blocks
        const nodes = this._insert(map(item));
        this._trackDOM(nodes);

    }

    _insert(dom) {
        if(typeof dom === 'function') dom = dom(); // recursive needed? this._insert(dom())?
        
        if(Array.isArray(dom)) {
            const map = new Array(dom.length);
            for(let i = 0; i < dom.length; i++) {
                map[i] = this._insert(dom[i]);
            }
            return map; 
        }
        else if(!(dom instanceof Node)) throwNoDOM(dom);

        // remove
        const { childNodes, unsubscribe } = dom;
        const nodes = childNodes.length > 1 ? [...childNodes] : childNodes[0];

        // clear
        this._trackUnsubscribe(dom);

        const { _anchor: anchor } = this;
        if(!anchor) throwNoAnchor();
        anchor.parentNode.insertBefore(dom, anchor);

        // remove
        return { nodes, unsubscribe };
    }

    removeByIndex(index) {
        // // FUTURE: when single element return is put in, optimize maybe like this:
        // // (would need to get right "index" if not only childNodes of parent)
        // const node = this._anchor.parentNode.childNodes[index];
        // node.unsubscribe();
        // node.remove();

        this.removeBlock(this._blocks[index]);
    }

    removeBlock(block) {
        if(Array.isArray(block)) {
            for(let i = 0; i < block.length; i++) this.removeBlock(block[i]);
            return;
        }

        const { nodes, unsubscribe } = block;

        if(Array.isArray(nodes)) {
            for(let c = 0; c < nodes.length; c++) nodes[c].remove();
        } 
        else nodes.remove();

        unsubscribe && unsubscribe();
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