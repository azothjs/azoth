export class Context {
    static is(context) {
        return context && context instanceof this;
    }

    constructor(node) {
        this.type = this.constructor.name;
        this.node = node;
    }
}
