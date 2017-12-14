import { Core } from './core';
import { ObservableArray } from '../observables/observable-array';

export { makeOverlay as Overlay };

function makeOverlay(observable) {
    return new Overlay(observable);
}

class Overlay extends Core {
    
    constructor(observableArray = new ObservableArray()) {
        super(observableArray);
    }

    set value(array) {
        this.observable.next(array);
    }
    
    onanchor(anchor) {
        this.anchor = anchor;
        const { blocks } = this;
        
        this.observable.subscribe(({ length, items }) => {
            if(items) {
                this.addBlocks(items, blocks.length);
            }
            else {
                this.removeBlocks(blocks.splice(length));
            }
        });
    }
}