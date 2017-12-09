import { Core } from './core';
import ObservableValue from '../observables/observable-value';

export default function makeSpliceable(observable) {
    return new Spliceable(observable);
}

class Spliceable extends Core {

    constructor(observable) {
        super(observable);
        this.indexes = [];
    }
    
    applyMap(item, index) {
        const { map } = this;
        if(map.length <= 1) return map(item);
        return map(item, this.indexes[index] = new ObservableValue(index));
    }

    get indexed() {
        return this.map && this.map.length > 1;
    }

    onanchor(anchor) {
        this.anchor = anchor;
        const { blocks, indexes } = this;
        
        this.observable.subscribe(({ index: startIndex, items, deleteCount = 0 }) => {
            const addCount = items ? items.length : 0;
            
            if(deleteCount > 0) {
                const toRemove = blocks.slice(startIndex, startIndex + deleteCount);
                this.removeBlocks(toRemove);
                const diff = deleteCount - addCount;
                if(diff > 0) {
                    blocks.splice(startIndex + addCount, diff);
                    indexes.splice(startIndex + addCount, diff);
                }
                if(diff < 0) {
                    const fill = Array(-diff).fill(null);
                    blocks.splice(startIndex, 0, ...fill);
                    indexes.splice(startIndex, 0, ...fill);
                }
            }
            
            if(addCount) {
                let before = anchor;
                const block = blocks[startIndex + addCount];
                if(block) {
                    const { nodes } = block;
                    before = Array.isArray(nodes) ? nodes[0] : nodes;
                }
                
                this.addBlocks(items, startIndex, before);
            }

            if(this.indexed && addCount !== deleteCount) {
                const { indexes } = this;
                for(let i = startIndex + addCount; i < indexes.length; i++) {
                    indexes[i].next(i);
                }
            }
        });
    }
}