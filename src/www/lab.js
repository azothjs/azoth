

class Component {
    cat = 'default cat';
    rendered = `<p>Hello ${this.cat}</p>`;
    
    constructor(cat) {
        this.cat = 'puss in boots';
    }
}

let c = new Component();

console.log(c.renderer);