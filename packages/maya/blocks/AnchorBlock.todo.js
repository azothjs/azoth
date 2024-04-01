import { compose } from '../compose';

export class BlockAnchor {
    #anchor = document.createComment(0);

    replace(input) {
        compose(this.#anchor, input, false);
    }

    append(input) {
        compose(this.#anchor, input, true);
    }

    remove() {
        compose(this.#anchor, null, false);
    }

    render() {
        return this.#anchor;
    }
}
