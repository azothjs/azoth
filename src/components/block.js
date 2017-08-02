import Base from './base';

export default function makeBlock(observable) {
    return new Block(observable);
}

export class Block extends Base {

    _render(value) {
        this._unrender();

        const { children: map } = this;
        if (!map) return;

        const fragment = map(value);

        if (Array.isArray(fragment)) {
            const unsubscribes = this._unsubscribes = [];
            for (let i = 0; i < fragment.length; i++) {
                const f = fragment[i];
                if (f.unsubscribe) unsubscribes.push(f);
                if (i !== 0) fragment[0].appendChild(f);
            }
            if (fragment.length) this._insert(fragment[0]);
        } else {
            this._unsubscribes = fragment.unsubscribe ? fragment : null;
            this._insert(fragment);
        }
    }
}