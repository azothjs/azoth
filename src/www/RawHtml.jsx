
export class RawHtml extends HTMLElement {
    static observedAttributes = ['html'];

    constructor() {
        super();
        // console.log(Object.getOwnPropertyNames(this));
        // console.log(this.elementProperties);
        if(Object.hasOwn(this, 'html')) {
            this.innerHTML = this.html;
            delete this.html;
        }
    }

    render() {
        return <li>{this.name}</li>;
    }

    attributeChangedCallback(name, old, value) {
        if(name === 'html') {
            this.html = value;
        }
    }

    connectedCallback() {
        console.log('RawHtml connected');
    }

    get html() {
        return this.innerHTML;
    }
    set html(value) {
        this.innerHTML = value;
    }
}

window.customElements.define('raw-html', RawHtml);
