import { compose } from '../azoth/compose.js';
import './style.css';

class $ extends HTMLElement {

}
    
class Generated$ extends $ {
    #anchor = null;
    
    set anchor(node) {
        this.#anchor = node;
        this.values = null;
    }
    get anchor() {
        return this.#anchor;
    }

    values = null;
    replace = false;
    set name(value) {
        if(this.anchor) compose(value, this.anchor);
        else if(this.values) this.values.name = `${value}`;
        else this.values = { name: `${value}` };
    }
    get name() {
        return this.anchor ? this.anchor.data : this.values?.name ?? '';
    } 

    render() : Node {
        throw new Error('must implement render');
    }

    connectedCallback() {
        const li = this.render()
        this.anchor  = li.childNodes[1];
        this.append(li);
    }
}

class CatCard extends Generated$ {
    static observedAttributes = ['name'];
    render() {
        return <li>{this.name}</li>;
    }
    attributeChangedCallback(name, old, value) {
        this[name] = value;
    }
}

customElements.define('cat-card', CatCard);

const felix = new CatCard();
felix.name = 'felix';

const name = 'Timmy';
document.body.append(
    <h1>Hello Azoth {3}</h1>,
    <cat-card name={name}/>,
    felix,
);

setTimeout(() => {
    felix.name = 'Sir Felix';
}, 500);

setTimeout(() => {
    felix.name = 'King Felix';
}, 1500);



