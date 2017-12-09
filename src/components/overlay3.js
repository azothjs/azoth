import { Core } from './core';

export { makeOverlay as Overlay };

function makeOverlay(observable) {
    return new Overlay(observable);
}

class Overlay extends Core {
    
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