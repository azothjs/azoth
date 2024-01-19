import { GENERATOR, generate } from 'astring';
import { TemplateContext } from './template-context.js';
import { ContextStack } from './context-stack.js';

function Generator() { }
Generator.prototype = GENERATOR;

function getNextLine(state) {
    const { indent, lineEnd, } = state;
    const indentation = indent.repeat(state.indentLevel);
    return `${lineEnd}${indentation}`;
}

const DEFAULT_NAMES = {
    renderer: `__rendererById`,
    targets: `__targets`,
    target: `__target`,
    root: `__root`,
    rootAliasPrefix: `t`,
};

export class AzothGenerator extends Generator {

    constructor(config) {
        super();
        this.names = config?.names ?? DEFAULT_NAMES;
        const generator = new HtmlGenerator();
        this.htmlGenerator = node => generate(node, {
            // TODO: ...config.html 
            generator,
        });

    }

    // (module) template context
    context = new ContextStack();
    get current() {
        return this.context.current;
    }
    get templates() {
        return this.context.all;
    }

    /* Adopt implicit arrow as containing function */
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

    /* Inject template statements above and return root dom */
    ReturnStatement(node, state) {
        if(node.argument?.type === 'JSXElement') {
            node.argument.noWrapper = true;
            this.JSXElement(node.argument, state);
            node.argument = {
                type: 'Identifier',
                name: `${this.names.rootAliasPrefix}${this.context.prior.id}`,
            };
        }
        super.ReturnStatement(node, state);
    }

    /*  Virtual method to create template context, represents
        missing overall "template" syntax marker in jsx.
        - Creates TemplateContext to track and analyze jsx chunk
        - Injects default IIFE wrapper if needed
        - Generates JavaScript from template context instance
    */
    JSXTemplate(node, state, isFragment) {
        const template = new TemplateContext(node, this.htmlGenerator, isFragment);
        this.context.push(template);

        let nextLine = getNextLine(state);

        const useWrapper = !node.noWrapper;
        if(useWrapper) {
            state.write(`(() => {`);
            state.indentLevel++;
            nextLine = getNextLine(state);
            state.write(nextLine);
        }

        // Feed the root element back to JSXElement
        // method for recursive analysis of jsx
        this[node.type](node, state);

        // generate the html
        template.generateHtml();

        /* Generate JavaScript */
        this.AzothDomLiteral(template, state);

        if(useWrapper) {
            state.write(`${nextLine}return ${this.names.rootAliasPrefix}${template.id};`);
            state.indentLevel--;
            nextLine = getNextLine(state);
            state.write(`${nextLine}})()`);
        }
        else {
            state.write(`${nextLine}`);
        }

        this.context.pop();
    }

    AzothDomLiteral({ id, targets, bindings, node, isFragment }, state) {
        const { indent, lineEnd, } = state;
        let indentation = indent.repeat(state.indentLevel);
        let nextLine = `${lineEnd}${indentation}`;

        // render and target references
        const { names } = this;
        const rootVarName = `${names.rootAliasPrefix}${id}`;
        state.write(`const { ${names.root}: ${rootVarName}, ${names.targets} }`);
        state.write(` = ${names.renderer}(`);
        state.write(`'${id}'`);
        if(isFragment && node.children.length > 1) {
            state.write(`, { fragment: true }`);
        }
        state.write(`);`);

        // target variables
        for(let i = 0; i < targets.length; i++) {
            const target = targets[i];
            if(target.bindCount === 1) continue;
            state.write(`${nextLine}const ${names.target}${i} = ${names.targets}[${i}];`);
        }

        // bindings
        for(let i = 0; i < bindings.length; i++) {
            const { element: { queryIndex, bindCount }, type, node, expr, index } = bindings[i];
            state.write(`${nextLine}`);

            let varName = '';

            if(queryIndex === -1) {
                varName = rootVarName;
            }
            else if(bindCount === 1) {
                varName = `${names.targets}[${queryIndex}]`;
            }
            else {
                varName = `${names.target}${queryIndex}`;
            }


            switch(type) {
                case 'child':
                    state.write(`__compose(${varName}.childNodes[${index}], `);
                    this[expr.type](expr, state);
                    state.write(`);`);
                    break;
                case 'prop':
                    state.write(varName);
                    state.write(`.${node.name.name} = `);
                    this[expr.type](expr, state);
                    state.write(';');
                    break;
                default: {
                    const message = `Unexpected binding type "${type}", expected "child" or "prop"`;
                    throw new Error(message);
                }
            }
        }
    }

    JSXFragment(node, state) {
        if(!TemplateContext.is(this.current)) {
            this.JSXTemplate(node, state, true);
            return;
        }
        if(this.current.node === node) {
            this.current.pushElement(node);
            this.JSXOpenFragment(node);
            this.JSXChildren(node);
            this.current.popElement();
        }
        else {
            this.JSXChildren(node);
        }
    }

    JSXElement(node, state) {
        if(!TemplateContext.is(this.current)) {
            this.JSXTemplate(node, state);
            return;
        }

        this.current.pushElement(node);
        this.JSXOpenElement(node);
        this.JSXChildren(node);
        this.current.popElement();
    }

    JSXOpenFragment({ openingFragment }) {
        this[openingFragment.type](openingFragment);
    }

    JSXOpenElement({ openingElement }) {
        this[openingElement.type](openingElement);
    }

    JSXOpeningFragment({ attributes }) {
        this.JSXAttributes(attributes);
    }

    JSXOpeningElement({ attributes }) {
        this.JSXAttributes(attributes);
    }

    JSXAttributes(attributes) {
        for(var i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            if(attr.value?.type !== 'JSXExpressionContainer') continue;
            this.current.bind('prop', attr, attr.value.expression, i);
        }
    }

    JSXChildren({ children }, adj = 0) {
        for(let i = 0; i < children.length; i++) {
            let child = children[i];
            if(child.type === 'JSXFragment') {
                // recursively add this fragments children
                // but continue the parent node's child count
                // as the fragment's child nodes will be inlined
                this.JSXChildren(child, i + adj);
                const length = child.children.length || 0;
                if(length) {
                    adj += length - 1; // expected one for child node
                }
                else {
                    adj--; // no child node was generated
                }
            }
            else {
                this[child.type](child, i + adj);
            }
        }
    }

    JSXExpressionContainer(node, index) {
        this.current.bind('child', node, node.expression, index);
    }

    JSXText() { /* no-op */ }
}

export class HtmlGenerator extends Generator {

    constructor(config) {
        super();
        this.childReplace = config?.childReplace ?? `<text-node></text-node>`;
    }

    // <div></div>
    JSXFragment(node, state) {
        this.JSXChildren(node, state);
    }
    // >.......</
    JSXChildren({ children }, state) {
        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            this[child.type](child, state);
        }
    }
    // <div></div>
    JSXElement(node, state) {
        state.write('<');
        this[node.openingElement.type](node.openingElement, state);

        if(node.closingElement) {
            state.write('>');
            this.JSXChildren(node, state);
            state.write('</');
            this[node.closingElement.type](node.closingElement, state);
            state.write('>');
        } else {
            state.write(' />');
        }
    }
    // <div>
    JSXOpeningElement(node, state) {
        this[node.name.type](node.name, state);
        for(var i = 0; i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            this[attr.type](attr, state);
        }
    }
    // </div>
    JSXClosingElement(node, state) {
        this[node.name.type](node.name, state);
    }
    // div
    JSXIdentifier(node, state) {
        state.write(node.name);
    }
    // Member.Expression
    JSXMemberExpression(node, state) {
        this[node.object.type](node.object, state);
        state.write('.');
        this[node.property.type](node.property, state);
    }
    // attr="something"
    JSXAttribute(node, state) {
        if(node.value?.type === 'JSXExpressionContainer') return;
        state.write(' ');
        this[node.name.type](node.name, state);
        if(node.value) {
            state.write('=');
            this[node.value.type](node.value, state);
        }
    }
    // namespaced:attr="something"
    JSXNamespacedName(node, state) {
        this[node.namespace.type](node.namespace, state);
        state.write(':');
        this[node.name.type](node.name, state);
    }
    // {expression}
    JSXExpressionContainer(node, state) {
        state.write(this.childReplace);
    }

    JSXText({ value }, state) {
        // const normalized = value.replace(NORMALIZE_PATTERN, ' ');
        state.write(value);
    }
}

// https://github.com/stevenvachon/normalize-html-whitespace/blob/master/index.js
// const NORMALIZE_PATTERN = /[\f\n\r\t\v ]{2,}/g;
