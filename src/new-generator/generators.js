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
    renderer: `__renderById`,
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
        this.generateHtml = node => generate(node, {
            // TODO: ...config.html 
            generator,
        });

    }

    // (module) template context
    context = new ContextStack();
    get current() {
        return this.context.current;
    }
    get last() {
        return this.context.current || this.context;
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
    JSXTemplate(node, state) {
        const template = new TemplateContext(node, this.generateHtml);
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
        this.generateJavaScript(template, state);

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

    generateJavaScript({ id, targets, bindings }, state) {
        const { indent, lineEnd, } = state;
        let indentation = indent.repeat(state.indentLevel);
        let nextLine = `${lineEnd}${indentation}`;

        // render and target references
        const { names } = this;

        state.write(`const { ${names.root}: ${names.rootAliasPrefix}${id}, ${names.targets} }`);
        // TODO: template service ftw!!!
        state.write(`= ${names.renderer}('${id}');`);
        for(let i = 0; i < targets.length; i++) {
            state.write(`${nextLine}const ${names.target}${i} = ${names.targets}[${i}];`);
        }

        // bindings
        for(let i = 0; i < bindings.length; i++) {
            const { element: { queryIndex }, type, node, expr, index } = bindings[i];
            state.write(`${nextLine}${names.target}${queryIndex}`);
            switch(type) {
                case 'child':
                    state.write(`.childNodes[${index}]`);
                    state.write(`.data = `);
                    break;
                case 'prop':
                    state.write(`.${node.name.name} = `);
                    break;
                default: {
                    const message = `Unexpected binding type "${type}", expected "child" or "prop"`;
                    throw new Error(message);
                }
            }
            this[expr.type](expr, state);
            state.write(';');
        }
    }

    JSXElement(node, state) {
        if(!TemplateContext.is(this.current)) {
            this.JSXTemplate(node, state);
            return;
        }

        this.current.pushElement(node); // open
        const { openingElement } = node;
        // attributes:
        this[openingElement.type](openingElement, state);
        // children:
        for(let i = 0; i < node.children.length; i++) {
            let child = node.children[i];
            child.parentIndex = i;
            this[child.type](child, i);
        }
        this.current.popElement(); // close
    }

    JSXExpressionContainer(node, index) {
        this.current.bind('child', node, node.expression, index);
    }

    JSXText() { /* no-op */ }

    JSXOpeningElement(node) {
        for(var i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            if(attr.value.type !== 'JSXExpressionContainer') continue;
            this.current.bind('prop', attr, attr.value.expression, i);
        }
    }
}

export class HtmlGenerator extends Generator {

    constructor(config) {
        super();
        this.childReplace = config?.childReplace ?? `<text-node></text-node>`;
    }

    // <div></div>
    JSXElement(node, state) {
        state.write('<');
        this[node.openingElement.type](node.openingElement, state);
        if(node.isBound) {
            state.write(' data-bind');
        }

        if(node.closingElement) {
            state.write('>');
            for(var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                this[child.type](child, state);
            }
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
        if(node.value.type === 'JSXExpressionContainer') return;

        state.write(' ');
        this[node.name.type](node.name, state);
        state.write('=');
        this[node.value.type](node.value, state);
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
