import { ContextStack } from './context-stack.js';

class Context {
    static is(context) {
        return context && context instanceof this;
    }

    node = null;
    constructor(node) {
        this.node = node;
    }
}

class ExpressionContext extends Context {
    type = 'expression';
}

const byOrder = (a, b) => a.order - b.order;

export class TemplateContext extends Context {
    #elements = new ContextStack();
    #elCount = 0;
    #targetEls = new Set();
    bindings = [];

    get targets() {
        const targets = [...this.#targetEls].sort(byOrder);
        for(let i = 0; i < targets.length; i++) {
            targets[i].queryIndex = i;
        }
        return targets;
    }

    pushElement(node) {
        this.#elements.push(node);
        node.order = ++this.#elCount;
    }

    popElement() {
        this.#elements.pop();
    }

    bind(type, node, expr, index) {
        const element = this.#elements.current;
        this.#targetEls.add(element);

        this.bindings.push({
            element,
            type,
            node,
            expr,
            index,
        });
    }
}
