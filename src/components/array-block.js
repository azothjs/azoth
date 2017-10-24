
export default function makeArrayBlock(observable) {
    return new ArrayBlock(observable);
}

class ArrayBlock {
    
    constructor(observable) {
        this._observable = observable;
        this._anchor = null;
        this._blocks = [];
    }

    onanchor(anchor) {
        this._topAnchor = anchor.previousSibling;        
        const { _blocks: blocks } = this;
        
        this._observable.subscribe(({ index, items, deleteCount }) => {
            let toRemove = null;
            if(items) {
                const block = blocks[index];
                const before = !block ? anchor : (
                    Array.isArray(block.nodes) ? block.nodes[0] : block.nodes
                );
                const parent = before.parentNode;
                
                const toInsert = new Array(items.length);

                for(let i = 0; i < items.length; i++) {
                    let fragment = this.map(items[i]);
                    if(typeof fragment === 'function') fragment = fragment();
                    // TODO: check that fragment is actually document fragment???
                    const { childNodes, unsubscribe } = fragment;

                    let nodes = null;
                    if(childNodes.length > 1) {
                        nodes = new Array(childNodes.length);
                        for(let c = 0; c < childNodes.length; c++) nodes[c] = childNodes[c];
                    }
                    else {
                        nodes = childNodes[0];
                    }

                    toInsert[i] = { nodes, unsubscribe };
                    parent.insertBefore(fragment, before);
                }

                toRemove = blocks.splice(index, deleteCount, ...toInsert);
            }
            else {
                toRemove = blocks.splice(index, deleteCount);
            }

            if(deleteCount > 0) removeBlocks(toRemove);
        });
    }

    unsubscribe() {
        removeBlocks(this._blocks);
    }
}

function removeBlocks(blocks) {
    for(let i = 0; i < blocks.length; i++) {
        const { nodes, unsubscribe } = blocks[i];
        
        if(Array.isArray(nodes)) {
            for(let c = 0; c < nodes.length; c++) nodes[c].remove();
        } 
        else nodes.remove();

        unsubscribe && unsubscribe();
    }
}