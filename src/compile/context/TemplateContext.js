import { Stack } from '../Stack.js';
import revHash from 'rev-hash';
import { Context } from './Context.js';

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
    #elements = new Stack();
    #elCount = 0;
    #targetEls = new Set();
    bindings = [];

    constructor(node, generator, isFragment) {
        super(node);
        this.generator = generator;
        this.isFragment = isFragment;
    }

    get rootChildrenLength() {
        return this.node.children.length;
    }

    get isSingleElementRoot() {
        // used jsx <>...</> tags
        if(this.isFragment) { 
            // <>{...}</> - bound childNode(s): 
            if(this.node.queryIndex === -1) return false;
            // <><hr/><hr/></> - multiple root elements:
            if(this.rootChildrenLength > 1) return false;
            // <><div></div></>
            return true;
        }
        // used an element: <div>...</div>
        return true;
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
            // fragments can't be "targets", so we give them
            // -1 queryIndex to signal a bound fragment root
            if(type === 'child') element.queryIndex = -1;
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
