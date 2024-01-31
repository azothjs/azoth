import './style.css';
import { compose } from '../azoth/compose.js';

// console.log(te19fd83eae)
class $ extends HTMLElement {

}
const category = 'category';
const place = 'place';
const render = () => <li className={'category'}>Hello {'place'}</li>;

class Generated$ extends $ {
    _anchor = null;

    set anchor(node) {
        this._anchor = node;
        this.values = null;
    }
    get anchor() {
        return this._anchor;
    }

    values = null;
    set name(value) {
        if(this.anchor) compose(value, this.anchor);
        else if(this.values) this.values.name = `${value}`;
        else this.values = { name: `${value}` };
    }
    get name() {
        return this.anchor ? this.anchor.data : this.values?.name ?? '';
    }

    render() {
        throw new Error('must implement render');
    }

    connectedCallback() {
        const li = this.render();
        this.anchor = li.childNodes[1];
        this.append(li);
    }
}


class CatCard extends Generated$ {
    static observedAttributes = ['name'];
    render() {
        return <li>{this.name}</li>;
    }
    attributeChangedCallback(name, old, value) {
        // @ts-ignore
        this[name] = value;
    }
}


customElements.define('cat-card', CatCard);

const felix = new CatCard();
felix.name = 'felix';

const name = 'Timmy';
const promise = Promise.resolve('a subject value');

document.body.append(
    <h1>Hello Azoth {3}</h1>,
    render(),
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



