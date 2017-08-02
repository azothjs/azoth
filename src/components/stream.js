import Base from './base';

export default function makeStream(observable) {
    return new Stream(observable);
}

export class Stream extends Base {
    constructor(observable) {
        super(observable);
        this._unsubscribes = [];
    }

    _unsubscribe() {
        const { _unsubscribes: unsubscribes } = this;
        
        for (let i = 0; i < unsubscribes.length; i++) {
            const unsub = unsubscribes[i];
            unsub.unsubscribe();
        }

        this._unsubscribes = [];
    }

    _render(value) {
        const { children: map } = this;
        if (!map) return;

        const fragment = map(value);
        const { _unsubscribes: unsubscribes } = this;

        if (Array.isArray(fragment)) {
            for (let i = 0; i < fragment.length; i++) {
                const f = fragment[i];
                if (f.unsubscribe) unsubscribes.push(f);
                if (i !== 0) fragment[0].appendChild(f);
            }
            if (fragment.length) this._insert(fragment[0]);
        } else {
            if(fragment.unsubscribe) unsubscribes.push(fragment);
            this._insert(fragment);
        }
    }
}