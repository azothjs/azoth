import { GENERATOR, generate } from 'astring';

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

class TemplateContext extends Context {
    type = 'template';
    elementStack = [];
    elementCount = 0;
    bindings = [];
    #targetEls = new Set();

    constructor(node) {
        super(node);
    }

    get targets() {
        const targets = [...this.#targetEls].sort((a, b) => a.order - b.order);
        targets.forEach((t, i) => t.queryIndex = i);
        return targets;
    }

    pushElement(node) {
        node.order = ++this.elementCount;
        this.elementStack.push(node);
    }

    popElement() {
        this.elementStack.pop();
    }

    bindChild(expr) {
        this.bind('child', expr, expr.expression);
    }

    bindAttr(attr) {
        this.bind('prop', attr, attr.value.expression);
    }

    bind(type, node, expr) {
        const element = this.elementStack.at(-1);
        this.#targetEls.add(element);

        this.bindings.push({
            element,
            type,
            node,
            expr,
        });
    }
}

function Generator() { }
Generator.prototype = GENERATOR;

export class AzothGenerator extends Generator {
    current = null;
    stack = [null];

    push(context) {
        this.stack.push(this.current = context);
    }

    pop() {
        const context = this.stack.pop();
        this.current = this.stack.at(-1);
        return context;
    }

    ArrowFunctionExpression(node, state) {
        if(node.body?.type === 'JSXElement') {
            node.body = {
                type: 'BlockStatement',
                body: [{
                    type: 'ReturnStatement',
                    argument: node.body,
                }]
            };
        }
        super.ArrowFunctionExpression(node, state);
    }

    ReturnStatement(node, state) {
        if(node.argument?.type === 'JSXElement') {
            node.argument.omitIIFE = true;
            this.JSXElement(node.argument, state);
            node.argument = {
                type: 'Identifier',
                name: '__root'
            };
        }
        super.ReturnStatement(node, state);
    }

    JSXTemplate(node, state) {
        const context = new TemplateContext();
        this.push(context);

        const { indent, lineEnd, } = state;
        let indentation = indent.repeat(state.indentLevel);

        const useIIFE = !node.omitIIFE;
        if(useIIFE) {
            state.write(`(() => {${lineEnd}`);
            state.indentLevel++;
            indentation = indent.repeat(state.indentLevel);
            state.write(indentation);
        }

        // this will analyze jsx into context
        this[node.type](node, state);
        const { targets, bindings } = context;

        // start depends on context
        // block statement / return -> has newline and indent
        state.write(`const { __root, __targets } = makeRenderer();`);

        const start = `${lineEnd}${indentation}`;

        for(let i = 0; i < targets.length; i++) {
            state.write(`${start}const __e${i} = __targets[${i}];`);
        }

        for(let i = 0; i < bindings.length; i++) {
            const { element: { queryIndex }, type, node, expr, } = bindings[i];
            state.write(`${start}__e${queryIndex}`);
            switch(type) {
                case 'child':
                    state.write(`.childNodes[${node.parentIndex}]`);
                    state.write(`.data = `);
                    break;
                case 'prop':
                    state.write(`.${node.name.name} = `);
                    break;
            }
            this[expr.type](expr, state);
            state.write(';');
        }

        if(useIIFE) {
            state.write(`${start}return __root;`);
            state.indentLevel--;
            state.write(`${lineEnd}${indent.repeat(state.indentLevel)}})()`);
        }
        else {
            state.write(`${start}`);
        }

    }
    // <div></div>
    JSXElement(node, state) {
        if(!TemplateContext.is(this.current)) {
            this.JSXTemplate(node, state);
            return;
        }

        this.current.pushElement(node);

        node.tag = node.openingElement.name.name;
        const { openingElement } = node;
        this[openingElement.type](openingElement, state);

        for(let i = 0; i < node.children.length; i++) {
            let child = node.children[i];
            child.parentIndex = i;
            if(child.type === 'JSXText') continue;

            try {
                this[child.type](child, state);
            }
            catch(err) {
                console.log(err.message + ':\n', child);
            }
        }

        this.current.popElement();
    }

    JSXExpressionContainer(node) {
        this.current.bindChild(node);
        // this.push(new ExpressionContext(node));
        // // this[node.expression.type](node.expression, state);
        // this.pop();
    }

    // <div>
    JSXOpeningElement(node) {
        for(var i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            if(attr.value.type !== 'JSXExpressionContainer') continue;
            this.current.bindAttr(attr);
        }
    }
    // // attr="something"
    // JSXAttribute(node, state) {
    //     state.write(' ');
    //     this[node.name.type](node.name, state);
    //     state.write('=');
    //     this[node.value.type](node.value, state);
    // }

    // // </div>
    // JSXClosingElement(node, state) {
    //     this[node.name.type](node.name, state);
    // }
    // // div
    // JSXIdentifier(node, state) {
    //     state.write(node.name);
    // }
    // // Member.Expression
    // JSXMemberExpression(node, state) {
    //     this[node.object.type](node.object, state);
    //     state.write('.');
    //     this[node.property.type](node.property, state);
    // }

    // // namespaced:attr="something"
    // JSXNamespacedName(node, state) {
    //     this[node.namespace.type](node.namespace, state);
    //     state.write(':');
    //     this[node.name.type](node.name, state);
    // }
    // // {expression}
    // JSXExpressionContainer(node, state) {
    //     state.write('{');
    //     this[node.expression.type](node.expression, state);
    //     state.write('}');
    // }
    // JSXText(node, state) {
    //     state.write(node.value);
    // }
}


// const html = {
//     // <div></div>
//     JSXElement(node, state) {
//         state.write('<');
//         this[node.openingElement.type](node.openingElement, state);
//         if(node.closingElement) {
//             state.write('>');
//             for(var i = 0; i < node.children.length; i++) {
//                 var child = node.children[i];
//                 this[child.type](child, state);
//             }
//             state.write('</');
//             this[node.closingElement.type](node.closingElement, state);
//             state.write('>');
//         } else {
//             state.write(' />');
//         }

//         state.html = state.html ?? [];
//         state.html.push(state.output);
//         state.output = output;
//     }
//     // <div>
//     JSXOpeningElement(node, state) {
//         this[node.name.type](node.name, state);
//         for(var i = 0; i < node.attributes.length; i++) {
//             var attr = node.attributes[i];
//             this[attr.type](attr, state);
//         }
//     }
//     // </div>
//     JSXClosingElement(node, state) {
//         this[node.name.type](node.name, state);
//     }
//     // div
//     JSXIdentifier(node, state) {
//         state.write(node.name);
//     }
//     // Member.Expression
//     JSXMemberExpression(node, state) {
//         this[node.object.type](node.object, state);
//         state.write('.');
//         this[node.property.type](node.property, state);
//     }
//     // attr="something"
//     JSXAttribute(node, state) {
//         state.write(' ');
//         this[node.name.type](node.name, state);
//         state.write('=');
//         this[node.value.type](node.value, state);
//     }
//     // namespaced:attr="something"
//     JSXNamespacedName(node, state) {
//         this[node.namespace.type](node.namespace, state);
//         state.write(':');
//         this[node.name.type](node.name, state);
//     }
//     // {expression}
//     JSXExpressionContainer(node, state) {
//         state.write('{');
//         this[node.expression.type](node.expression, state);
//         state.write('}');
//     }
//     JSXText(node, state) {
//         state.write(node.value);
//     }
// };