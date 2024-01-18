export class ContextStack {
    #stack = [];
    #current = null;
    #all = new Set();

    push(context) {
        this.#current = context;
        this.#all.add(context);
        this.#stack.push(context);
    }
    pop() {
        const context = this.#stack.pop();
        this.#current = this.#stack.at(-1);
        return context;
    }
    get current() {
        return this.#current;
    }
    get all() {
        return [...this.#all];
    }
}
