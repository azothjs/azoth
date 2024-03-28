import { compose } from '../compose';

export class BlockAnchor {
    #anchor = document.createComment(0);

    constructor({ source, loader }) {
        this.source = source;
        this.updates = loader(this);
    }

    async #start() {
        const { updates } = this;
        for await(const message of this.source) {
            const [key, value] = Object.entries(message)[0];
            updates[key](value);
        }
    }

    replace(input) {
        compose(this.#anchor, input);
    }

    append(input) {
        compose(this.#anchor, input, true);
    }

    remove() {
        compose(this.#anchor, null);
    }

    render() {
        this.#start();
        return this.#anchor;
    }
}


// function fociLoader(anchor) {
//     return {
//         load(foci) {
//             anchor.replace(foci.map(focus => <Focus focus={focus} />));
//         },
//         add(focus) {
//             anchor.append(<Focus focus={focus} />);
//         },
//         remove() {
//             anchor.remove();
//         },
//         update(update) {
//             // TODO: would be no-op for content editable
//             // or other source input...
//             anchor.replace(<Focus focus={update} />);
//         }
//     };
// }

