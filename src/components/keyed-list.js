export default function makeKeyedList(observable) {
    return new KeyedList(observable);
}

class KeyedList {
    
    constructor(observable) {
        // TODO: assert observable exists and is observable
        this._observable = observable;
        this._anchor = null;
        // this._blocks = [];
        this._byKey = new Map();
    }

    _getBefore(key) {
        if(!key) return null;
        const found = this._byKey.get(key);
        // TODO: throw if not found?
        if(!found) return null;
        const { nodes } = found;
        return Array.isArray(nodes) ? nodes[0] : nodes;
    }

    onanchor(anchor) {
        this._anchor = anchor;
        const { _byKey: byKey } = this;
        
        this._observable.subscribe(({ action, key, item, next }) => {
            const parent = anchor.parentNode;
            
            switch(action) {
                case 'added': {
                    let fragment = this.map(item);
                    if(typeof fragment === 'function') fragment = fragment();
                    const { childNodes, unsubscribe } = fragment;
                    
                    let nodes = null;

                    if(childNodes.length > 1) {
                        nodes = new Array(childNodes.length);
                        for(let c = 0; c < childNodes.length; c++) nodes[c] = childNodes[c];
                    }
                    else {
                        nodes = childNodes[0];
                    }
                    
                    byKey.set(key||item, { nodes, unsubscribe });
                    let before = this._getBefore(next) || anchor;
                    
                    parent.insertBefore(fragment, before);
                    break;
                }
                case 'moved': {
                    const toMove = byKey.get(key);
                    // TODO: if(!toMove) ???
                    let before = this._getBefore(next) || anchor;
                    const { nodes } = toMove;
                    if(Array.isArray(nodes)) {
                        for(let i = 0; i < nodes.length; i++) parent.insertBefore(nodes[i], before);
                    }
                    else parent.insertBefore(nodes, before);
                    break;
                }
                case 'removed': {
                    const toRemove = byKey.get(key);
                    // TODO: if(!toRemove) ???
                    byKey.delete(key);

                    const { nodes, unsubscribe } = toRemove;
                    if(Array.isArray(nodes)) {
                        for(let i = 0; i < nodes.length; i++) nodes[i].remove();
                    }
                    else nodes.remove();

                    unsubscribe && unsubscribe();
                }
            }
        });
    }

    unsubscribe() {        
        removeBlocks([...this._byKey.values()]);
    }
}

function removeBlocks(blocks) {
    for(let i = 0; i < blocks.length; i++) {
        const { nodes, unsubscribe, index } = blocks[i];
        if(index) index.destroy();

        if(Array.isArray(nodes)) {
            for(let c = 0; c < nodes.length; c++) nodes[c].remove();
        } 
        else nodes.remove();

        unsubscribe && unsubscribe();
    }
}