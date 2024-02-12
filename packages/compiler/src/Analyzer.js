import { Stack } from './Stack.js';
import { Template } from './Template.js';
import { voidElements } from './html.js';

const BINDING_ATTR = {
    type: 'JSXAttribute',
    name: {
        type: 'JSXIdentifier',
        name: 'data-bind'
    },
    value: null,
};

const byOrder = (a, b) => a.order - b.order;

const isWhitespace = ({ type, value }) => {
    if(type !== 'JSXText') return false;
    // eslint-disable-next-line eqeqeq
    if(value == undefined) return false;
    if(/^\S/.test(value)) return false;
    return true;
};

export class Analyzer {
    #elements = new Stack();
    #documentOrder = 0;
    #boundElements = new Set();
    #bindings = [];
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
        const { type, children } = node;
        const isJSXFragment = node.isJSXFragment = type === 'JSXFragment';

        const { length } = children;
        if(isJSXFragment && length >= 1 && length <= 3) {
            // if(length > 1) {
            //     const first = children[0];
            //     const last = children.at(-1);

            // }
            // if(children.length !== 1) {
            //     isWhitespace(first)
            // }
            // switch(children.length) {
            //     case 3: {
            //         const { type, value } = children[0];
            //         if(type !== 'JSXText') break;
            //         // eslint-disable-next-line eqeqeq
            //         if(value == undefined) break;
            //         if(/^\S/.test(value)) break;
            //     }
            // }


            let start = -1;

            while(start < children.length - 1) {
                const child = children[++start];
                const { type, value } = child;
                if(type !== 'JSXText') break;
                // eslint-disable-next-line eqeqeq
                if(value == undefined) break;
                if(/^\S/.test(value)) break;
            }

            let end = children.length;
            // eslint-disable-next-line no-constant-condition
            while(end > start + 1) {
                const child = children[--end];
                const { type, value } = child;
                if(type !== 'JSXText') break;
                // eslint-disable-next-line eqeqeq
                if(value == undefined) break;
                if(/^\S/.test(value)) break;
            }

            const trimmed = children.slice(start, end);

            if(trimmed.length === 1 && trimmed[0].type === 'JSXElement') {
                // <><div>...</div></>  
                return this.#analyze(trimmed[0]);
            }
        }

        this.#root = node;

        if(isJSXFragment) {
            this.JSXFragmentRoot(node);
        }
        else {
            accessElement(node);
            this.JSXElement(node);
            // if(node.isComponent) {
            //     this.#bind('child', node, identifier);
            // }
        }
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

        if(element && element.isComponent) {
            element.props.push(binding);
        }
        else {
            this.#bindings.push(binding);
        }

        if(!element || element.isComponent) return;

        if(element === this.#root) {
            // root can't be a "target", so we give them
            // -1 queryIndex to signal a bound fragment or element at root
            element.queryIndex = -1;
        }
        // track element as bound
        else if(!this.#boundElements.has(element)) {
            element.openingElement?.attributes.push(BINDING_ATTR);
            this.#boundElements.add(element);
        }
    }

    JSXFragmentRoot(node) {
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
        if(node.isComponent) {
            this.JSXProps(node.openingElement.attributes);
            if(node.children.length) {
                node.slotFragment = {
                    type: 'JSXFragment',
                    children: node.children,
                    openingFragment: {
                        attributes: []
                    }
                };
            }
        } else {
            this.JSXAttributes(node.openingElement.attributes);
            this.JSXChildren(node);
        }

        this.#popElement();
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
                accessElement(child);
                if(child.isComponent) {
                    this.#bind('child', child, child.componentExpr, i + adj);
                }
                this[type](child, i + adj);
            }
        }
    }

    JSXProps(attributes) {
        for(var i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            this.#bind('prop', attr, attr.value, i);
        }
    }

    JSXAttributes(attributes) {
        for(var i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            if(attr.value?.type === 'JSXExpressionContainer') {
                this.#bind('prop', attr, attr.value.expression, i);
            }
        }
    }

    JSXExpressionContainer(node, index) {
        if(node.expression.type === 'JSXEmptyExpression') return;
        this.#bind('child', node, node.expression, index);
    }

    JSXText() { /* no-op */ }
    JSXEmptyExpression() { /* no-op */ }
}

function accessElement(node) {
    if(node.type !== 'JSXElement') return;

    const { openingElement: { name: identifier } } = node;
    // TODO: <namespaces:el and <member.express.ion
    const isCustom = node.isCustomElement = identifier.name.includes('-');
    node.isVoidElement = !isCustom && voidElements.has(identifier.name);
    const isComponent = node.isComponent = !isCustom && /^[A-Z$][a-zA-Z]*$/.test(identifier.name);
    if(isComponent) {
        node.props = [];
        node.componentExpr = identifier;
    }
}