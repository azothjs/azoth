import ObservableValue from '../observables/observable-value';

export default function makeSpliceable(observable) {
    return new Spliceable(observable);
}

class Spliceable {
    
    constructor(observable) {
        this._observable = observable;
        this._blocks = [];
    }

    onanchor(anchor) {
        const { _blocks: blocks } = this;
        const indexed = this.map.length > 1;
        
        this._observable.subscribe(({ index: startIndex, items, deleteCount = 0 }) => {
            let toRemove = null;
            const addCount = items ? items.length : 0;

            if(addCount) {
                const block = blocks[startIndex];
                const before = !block ? anchor : (
                    Array.isArray(block.nodes) ? block.nodes[0] : block.nodes
                );
                const parent = before.parentNode;
                
                const toInsert = new Array(items.length);

                for(let i = 0; i < items.length; i++) {
                    const index = indexed ? new ObservableValue(startIndex + i) : undefined; 
                    let fragment = this.map(items[i], index);
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

                    toInsert[i] = { nodes, unsubscribe, index };
                    parent.insertBefore(fragment, before);
                }

                toRemove = blocks.splice(startIndex, deleteCount, ...toInsert);
            }
            else {
                toRemove = blocks.splice(startIndex, deleteCount);
            }

            if(deleteCount > 0) removeBlocks(toRemove);

            if(indexed && addCount !== deleteCount) {
                for(let i = startIndex + addCount; i < blocks.length; i++) {
                    blocks[i].index.next(i);
                }
            }
        });
    }

    unsubscribe() {        
        removeBlocks(this._blocks);
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