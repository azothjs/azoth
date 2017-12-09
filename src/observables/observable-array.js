import ObservableValue from '../observables/observable1';

export class ObservableArray extends ObservableValue {
    constructor(array) {
        super(null);
        this.track = [];
        if(array) this.next(array);
    }

    get firstValue() {
        const { track } = this;
        return {
            length: track.length,
            items: track
        };
    }

    next(array) {
        const { track } = this;
        const { length } = array;
        const { length: originalLength } = track;
        track.length = length;

        for(let i = 0; i < length; i++) {
            if(i < originalLength) track[i].next(array[i]);
            else track[i] = new ObservableValue(array[i]);
        }

        if(originalLength === length) return;

        super.next({
            length,
            items: length > originalLength ? track.slice(originalLength) : null
        });
    }
}