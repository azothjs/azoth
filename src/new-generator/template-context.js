import { ContextStack } from './context-stack.js';
import revHash from 'rev-hash';

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

function getBindingAttr() {
    return {
        type: 'JSXAttribute',
        name: {
            type: 'JSXIdentifier',
            name: 'data-bind'
        },
        value: null,
    };
}

const byOrder = (a, b) => a.order - b.order;

export class TemplateContext extends Context {
    #elements = new ContextStack();
    #elCount = 0;
    #targetEls = new Set();
    bindings = [];

    constructor(node, generator, isFragment) {
        super(node);
        this.generator = generator;
        this.isFragment = isFragment;
    }

    generateHtml() {
        this.html = this.generator(this.node);
        this.id = revHash(this.html);
    }

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

        this.bindings.push({
            element,
            type,
            node,
            expr,
            index,
        });

        if(element === this.node && this.isFragment) {
            if(type === 'child' && element.queryIndex !== -1) {
                element.queryIndex = -1;
            }
        }
        else {
            const prop = `${type}BoundCount`;
            element[prop] = (element[prop] || 0) + 1;
            if(!this.#targetEls.has(element)) {
                element.openingElement?.attributes.push(getBindingAttr());
                this.#targetEls.add(element);
            }
        }
    }
}
