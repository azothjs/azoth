import ObservableValue from '../observables/observable-value';

export default function makeOverlay(observable) {
    return new Overlay(observable);
}

class Overlay {
    
    constructor(observable) {
        this._observable = observable;
        this._blocks = [];
    }

    onanchor(anchor) {
        const { _blocks: blocks } = this;
        
        this._observable.subscribe(array => {
            const parent = anchor.parentNode;
            const max = Math.max(blocks.length, array.length);
            for(let i = 0; i < max; i++) {
                const value = array[i];
                const block = blocks[i];
                if(!block) {
                    const observable = new ObservableValue(value); 
                    let fragment = this.map(observable, i);
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

                    blocks[i] = { nodes, unsubscribe, observable };
                    parent.insertBefore(fragment, anchor);
                }
                else if(array.length > i) {
                    block.observable.next(value);
                }
                else {
                    const { nodes, unsubscribe, observable } = blocks[i];
                    if(observable) observable.destroy();
            
                    if(Array.isArray(nodes)) {
                        for(let c = 0; c < nodes.length; c++) nodes[c].remove();
                    } 
                    else nodes.remove();
            
                    unsubscribe && unsubscribe();
                }
            }
            blocks.length = array.length;
        });
    }

    unsubscribe() {        
        removeBlocks(this._blocks);
    }
}

function removeBlocks(blocks) {
    for(let i = 0; i < blocks.length; i++) {
        const { nodes, unsubscribe, observable } = blocks[i];
        if(observable) observable.destroy();

        if(Array.isArray(nodes)) {
            for(let c = 0; c < nodes.length; c++) nodes[c].remove();
        } 
        else nodes.remove();

        unsubscribe && unsubscribe();
    }
}