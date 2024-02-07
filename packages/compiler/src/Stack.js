export class Stack {
    #current = null;
    #stack = [];
    
    get current() {
        return this.#current;
    }

    push(context) {
        this.#current = context;
        this.#stack.push(context);
    }

    pop() {
        const context = this.#stack.pop();
        this.#current = this.#stack.at(-1);
        return context;
    }
}
