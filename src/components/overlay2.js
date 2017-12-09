
export { makeOverlay as Overlay };

function makeOverlay(observable) {
    return new Overlay(observable);
}

class Overlay {
    
    constructor(observable) {
        this._observable = observable;
        this._blocks = [];
    }

    onanchor(anchor) {
        const { _blocks: blocks } = this;
        
        this._observable.subscribe(({ length, items }) => {
            const parent = anchor.parentNode;
            if(items) {
                const { length: blocksLength } = blocks;
                for(let i = 0; i < items.length; i++) {
                    const blockIndex = blocksLength + i;
                    let fragment = this.map(items[i], blockIndex);
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

                    blocks[blockIndex] = { nodes, unsubscribe };
                    parent.insertBefore(fragment, anchor);
                }
            }
            else {
                removeBlocks(blocks.splice(length));
            }
            
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