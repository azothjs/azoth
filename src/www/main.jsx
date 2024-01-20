import './style.css';


class CatCard {
    name = 'init';
    foo = 'foo';
    body = null;
    constructor({ name }) {
        this.name = name;
        this.render();
    }
    connectedCallback() {
        this.body = <li>{this.name}</li>;
    }
}

const cat = new Cat({ name: 'Duchess' });

document.body.append(
    <h1>Hello Azoth {3}</h1>,
    <cat-card/>,
    cat.body,
);
