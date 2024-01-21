import './style.css';


class CatCard extends HTMLElement {
    static observedAttributes = ['name'];
    #name = '';
    set name(value) {
        this.#name = value;
    }
    get name() {
        return this.#name;
    }
    connectedCallback() {
        this.append(<li>{this.name}</li>);
    }
    attributeChangedCallback(name, old, value) {
        this[name] = value;
    }
}

customElements.define('cat-card', CatCard);
const name = 'Timmy';

const felix = new CatCard();
felix.name = 'felix';

document.body.append(
    <h1>Hello Azoth {3}</h1>,
    <cat-card name={name}/>,
    felix,
);
