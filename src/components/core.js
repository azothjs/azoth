export class Core {
    
    constructor(observable) {
        this.observable = observable;
        this.blocks = [];
        this.anchor = null;
        this.map = null;
    }

    applyMap(item, index) {
        return this.map(item, index);
    }

    addBlocks(items, offset, before) {
        const { anchor, blocks } = this;
        const parent = this.anchor.parentNode;
        before = before || anchor;
        
        for(let i = 0; i < items.length; i++) {
            const blockIndex = offset + i;
            let fragment = this.applyMap(items[i], blockIndex);
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
            parent.insertBefore(fragment, before);
        }
    }

    removeBlocks(blocks) {
        for(let i = 0; i < blocks.length; i++) {
            const { nodes, unsubscribe } = blocks[i];
    
            if(Array.isArray(nodes)) {
                for(let c = 0; c < nodes.length; c++) nodes[c].remove();
            } 
            else nodes.remove();
    
            unsubscribe && unsubscribe();
        }
    }

    unsubscribe() {        
        this.removeBlocks(this.blocks);
    }  
}
