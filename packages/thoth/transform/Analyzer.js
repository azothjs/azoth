import { BIND, Template } from './Template.js';
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

export class Analyzer {
    #elements = []; // stack
    #documentOrder = 0;
    #boundElements = new Set();
    #bindings = [];
    #root = null;
    #imports = new Set();

    constructor(node) {
        this.#analyze(node);

        // order cannot be determined until after full analysis
        const boundElements = [...this.#boundElements].sort(byOrder);
        for(let i = 0; i < boundElements.length; i++) {
            boundElements[i].queryIndex = i;
        }

        this.template = new Template(this.#root, {
            bindings: this.#bindings,
            boundElements,
            imports: [...(this.#imports.values())],
        });
    }

    #analyze(node) {
        const isJSXFragment = node.isJSXFragment = node.type === 'JSXFragment';

        if(isJSXFragment) {
            // trims whitespace with newline from first/last
            trimChildren(node);
            const { children } = node;

            // Empty <></>:
            if(children.length === 0) {
                this.#root = node;
                return;
            }

            if(children.length === 1) {
                const soloChild = children[0];
                const { type } = soloChild;
                // <><p>...</p></> or <Component><p>...</p></Component>
                // <><>...</></> or <Component><>...</></Component>
                if(type === 'JSXElement' || type === 'JSXFragment') {
                    this.#analyze(soloChild);
                    return;
                }
            }
        }

        this.#root = node;

        if(isJSXFragment) {
            this.JSXFragmentRoot(node);
        }
        else {
            assessElement(node);
            if(node.isComponent) this.#imports.add('rC');
            this.JSXElement(node);
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
        const element = this.#elements.at(-1); // peek
        element.isRoot = element === this.#root;

        const binding = {
            element,
            type,
            node,
            expr,
            index,
            // placeholder value until after analysis complete
            queryIndex: -2,
        };

        if(element.isComponent) {
            // only props, component children are "slot" template
            if(type !== BIND.PROP && type !== BIND.SPREAD) {
                throw new TypeError(`Unexpected binding type "${type}", expected "BIND.PROP" or "BIND.SPREAD"`);
            }

            // early exit! components get bindings as obj literal props
            element.props.push(binding);
            return;
        }

        this.#bindings.push(binding);

        if(element.isRoot) {
            // root can't be a "target", it gets a -1 queryIndex 
            // to signal bound template root (either el or fragment)
            element.queryIndex = -1;
        }
        else {
            // track element as having bindings
            if(!this.#boundElements.has(element)) {
                // querySelectorAll locator at runtime:
                element.openingElement?.attributes.push(BINDING_ATTR);
                this.#boundElements.add(element);
            }
        }
    }

    JSXFragmentRoot(node) {
        this.#pushElement(node);
        if(node.openingFragment) {
            this.JSXComponentAttributes(node.openingFragment.attributes);
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

        if(node.isComponent) {
            this.JSXComponentAttributes(node.openingElement.attributes);
            if(node.children.length) {
                node.slotFragment = {
                    type: 'JSXFragment',
                    children: node.children,
                    openingFragment: {
                        type: 'JSXOpeningFragment',
                        attributes: []
                    }
                };
            }
        } else {
            this.JSXAttributes(node.openingElement.attributes, true);
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
                assessElement(child);
                if(child.isComponent) {
                    this.#bind(BIND.COMPONENT, child, child.componentExpr, i + adj);
                }
                this[type](child, i + adj);
            }
        }
    }

    JSXComponentAttributes(attributes) {
        this.JSXAttributes(attributes, false);
    }

    JSXAttributes(attributes, jsxOnly = true) {
        for(var i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            if(attr.type === 'JSXSpreadAttribute') {
                this.#bind(BIND.SPREAD, attr, attr.argument, i);
                continue;
            }

            let expr = attr.value;
            const isJSXExpr = expr?.type === 'JSXExpressionContainer';
            if(jsxOnly && !isJSXExpr) continue;

            // element attributes = static html
            // component props = code gen js obj literal prop
            if(isJSXExpr) expr = expr.expression;
            this.#bind(BIND.PROP, attr, expr, i);
        }
    }

    JSXExpressionContainer(node, index) {
        if(node.expression.type === 'JSXEmptyExpression') return;
        this.#bind(BIND.CHILD, node, node.expression, index);
    }

    JSXText() { /* no-op */ }
    JSXEmptyExpression() { /* no-op */ }
}

function assessElement(node) {
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

function trimChildren(node) {
    if(!node.children.length) return;

    const trimmed = node.children.slice();
    const isTrim = ({ type, value }) => {
        return type === 'JSXText' && /^\s*[\r\n]+\s*$/.test(value);
    };
    if(isTrim(trimmed.at(-1))) trimmed.pop();
    if(trimmed.length && isTrim(trimmed[0])) trimmed.shift();

    if(trimmed.length !== node.children.length) {
        node.children = trimmed;
    }
}
