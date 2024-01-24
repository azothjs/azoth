export class Stack {
    #current = null;
    #stack = [];
    #all = new Set();
    
    get current() {
        return this.#current;
    }

    get all() {
        return [...this.#all];
    }

    push(context) {
        this.#current = context;
        this.#stack.push(context);
        this.#all.add(context);
    }

    pop() {
        const context = this.#stack.pop();
        this.#current = this.#stack.at(-1);
        return context;
    }
}
