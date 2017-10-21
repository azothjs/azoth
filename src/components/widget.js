export default class Widget {
    
    constructor() {
        this._unsubscribe = null;
    }

    onanchor(anchor) {
        const fragment = this.renderWith();
        anchor.parentNode.insertBefore(fragment, anchor);
        this._unsubscribe = fragment.unsubscribe || null;
    }

    unsubscribe() {
        this._unsubscribe && this._unsubscribe();
    }

    renderWith() {
        return this.render();
    }

    render() {
        console.warn(`Class ${this.prototype.constructor.name} which extends ${Widget.name} needs to implement a render() method`);
    }
}