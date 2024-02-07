import { Stack } from './Stack.js';
import { Template } from './Template.js';

const BINDING_ATTR = {
    type: 'JSXAttribute',
    name: {
        type: 'JSXIdentifier',
        name: 'data-bind'
    },
    value: null,
};

const byOrder = (a, b) => a.order - b.order;

export class Analyzer {
    #elements = new Stack();
    #documentOrder = 0;
    #boundElements = new Set();
    #bindings = [];
    #isComponentRoot = true;
    #template = null;
    #root = null;

    constructor(node) {
        this.#analyze(node);

        const boundElements = [...this.#boundElements].sort(byOrder);
        for(let i = 0; i < boundElements.length; i++) {
            boundElements[i].queryIndex = i;
        }

        this.#template = new Template(this.#root, {
            bindings: this.#bindings,
            boundElements,
        });
    }

    generateTemplate(htmlGenerator) {
        const template = this.#template;
        template.html = htmlGenerator(template.node);
        return template;
    }

    #analyze(node) {
        // handle single top-level components with a fake fragment
        const root = node.type === 'JSXFragment' ? node : {
            type: 'JSXFragment',
            children: [node],
            openingFragment: {
                attributes: []
            },
            isReturnArg: node.isReturnArg
        };
        this.#root = root;
        this.JSXRootFragment(root);
    }

    #pushElement(node) {
        this.#elements.push(node);
        node.order = ++this.#documentOrder;
    }

    #popElement() {
        this.#elements.pop();
    }

    #bind(type, node, expr, index) {
        const element = this.#elements.current;

        const binding = {
            element,
            type,
            node,
            expr,
            index,
        };

        if(element?.isComponent) {
            element.props.push(binding);
            return;
        }

        this.#bindings.push(binding);

        if(element === this.#root) {
            // fragment root can't be a "targets", so we give them
            // -1 queryIndex to signal a bound fragment at root
            if(type === 'child') element.queryIndex = -1;
            return;
        }

        // track element as bound
        if(!this.#boundElements.has(element)) {
            element.openingElement?.attributes.push(BINDING_ATTR);
            this.#boundElements.add(element);
        }
    }

    JSXRootFragment(node) {
        this.#pushElement(node);
        // short-cut JSXOpeningFragment > JSXAttributes
        // this[node.openingFragment.type](node.openingFragment); 
        if(node.openingFragment) {
            this.JSXAttributes(node.openingFragment.attributes);
        }
        this.JSXChildren(node);
        this.#popElement();
    }

    JSXFragment(node) {
        // extraneous fragment in fragment: inline children
        this.JSXChildren(node);
    }

    JSXElement(node) {
        this.#pushElement(node);
        // short-cut JSXOpeningElement > JSXAttributes
        this.JSXAttributes(node.openingElement.attributes, node.isComponent);
        this.JSXChildren(node);
        this.#popElement();
    }

    JSXAttributes(attributes, isComponent = false) {
        for(var i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            if(attr.value?.type === 'JSXExpressionContainer') {
                this.#bind('prop', attr, attr.value.expression, i);
            }
            else if(isComponent) {
                this.#bind('prop', attr, attr.value, i);
            }
        }
    }

    JSXExpressionContainer(node, index) {
        if(node.expression.type === 'JSXEmptyExpression') {
            return;
        }
        this.#bind('child', node, node.expression, index);
    }

    // Tracks index adjustments across recursive calls:
    // - flatten nodes on extraneous fragment
    // - skip {/*empty*} and <></>
    JSXChildren({ children }, adj = 0) {
        for(let i = 0; i < children.length; i++) {
            const child = children[i];
            const { type } = child;
            if(type === 'JSXFragment') {
                // recursive call: continue this parent's index 
                this.JSXChildren(child, i + adj);
                // adj tracks changes, so we can use length as-is:
                const length = child.children.length || 0;
                if(length) {
                    adj += length - 1; // expected 1 anyway
                }
                else {
                    adj--; // no node generated, take 1 away
                }
            }
            else if(type === 'JSXExpressionContainer' &&
                child.expression.type === 'JSXEmptyExpression') {
                adj--; // skip this node, take 1 away
            }
            else if(!this[type]) {
                throw new TypeError(`Unexpected AST Type "${type}"`);
            }
            else {
                if(type === 'JSXElement') {
                    const { openingElement: { name: identifier } } = child;
                    // TODO: namespaces: and member.express.ion
                    const isComponent = /^[A-Z$][a-zA-Z]*$/.test(identifier.name);
                    if(isComponent) {
                        child.isComponent = true;
                        child.props = [];
                        this.#bind('child', child, identifier, i + adj);
                    }
                }

                this[type](child, i + adj);
            }
        }
    }

    JSXText() { /* no-op */ }
    JSXEmptyExpression() { /* no-op */ }
}


