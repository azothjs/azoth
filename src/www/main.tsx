import { compose } from '../../packages/azoth/compose.js';
import './style.css';

class $ extends HTMLElement {

}

const render = () => <li>Hello {'world'}?</li>

class Generated$ extends $ {
    _anchor: Comment | null = null;

    set anchor(node) {
        this._anchor = node;
        this.values = null;
    }
    get anchor() {
        return this._anchor;
    }

    values: { name: string } | null = null;
    set name(value) {
        if(this.anchor) compose(value, this.anchor);
        else if(this.values) this.values.name = `${value}`;
        else this.values = { name: `${value}` };
    }
    get name() {
        return this.anchor ? this.anchor.data : this.values?.name ?? '';
    }

    render(): Node {
        throw new Error('must implement render');
    }

    connectedCallback() {
        const li = this.render()
        this.anchor = li.childNodes[1] as Comment;
        this.append(li);
    }
}


declare global {
    interface HTMLElement {
        'cat-card': CatCard;
    }
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
            "cat-card": {
                name: string;
                // render: () => Node;
            };
        }
    }
}

class CatCard extends Generated$ {
    static observedAttributes = ['name'];
    render() {
        return <li>{this.name}</li>;
    }
    attributeChangedCallback(name: string, old: string, value: string) {
        // @ts-ignore
        this[name] = value;
    }
}


customElements.define('cat-card', CatCard);

const felix = new CatCard();
felix.name = 'felix';

const name = 'Timmy';
const promise = Promise.resolve('a future value');

document.body.append(
    <h1>Hello Azoth {3}</h1>,
    <cat-card name={name} />,
    <li>{promise}</li>,
    felix,
);

setTimeout(() => {
    felix.name = 'Sir Felix';
}, 500);

setTimeout(() => {
    felix.name = 'King Felix';
}, 1500);



