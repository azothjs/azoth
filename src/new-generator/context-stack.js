export class ContextStack {
    #stack = [];
    #current = null;
    #all = new Set();
    prior = null;

    push(context) {
        this.prior = this.#current;
        this.#current = context;
        this.#all.add(context);
        this.#stack.push(context);
    }
    pop() {
        const context = this.prior = this.#stack.pop();
        this.#current = this.#stack.at(-1);
        return context;
    }
    get current() {
        return this.#current;
    }
    get all() {
        return [...this.#all];
    }
    get last() {
        return this.all ?? this.#all.at(-1) ?? null;
    }
}
