import { GENERATOR, generate } from 'astring';
import { ExpressionContext, TemplateContext } from './template-context.js';
import { ContextStack } from './context-stack.js';
import isValidName from 'is-valid-var-name';

function Generator() { }
Generator.prototype = GENERATOR;

function getNextLine(state) {
    const { indent, lineEnd, } = state;
    const indentation = indent.repeat(state.indentLevel);
    return `${lineEnd}${indentation}`;
}

const DEFAULT_NAMES = {
    renderer: `t`,
    targets: `targets`,
    targetsAlias: `__targets`,
    target: `__target`,
    child: `__child`,
    root: `fragment`,
    rootAliasPrefix: `__root_`,
};

export class AzothGenerator extends Generator {
    templates = [];

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
        this.templates.push(template);
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

        // template service renderer call
        const { names } = this;
        const rootVarName = `${names.rootAliasPrefix}${id}`;
        state.write(`const { ${names.root}: ${rootVarName}, ${names.targets}: ${names.targetsAlias} }`);
        state.write(` = ${names.renderer}${id}(`);
        if(isFragment && node.children.length > 1) {
            state.write(`{ fragment: true }`);
        }
        state.write(`);`);

        // target variables
        for(let i = 0; i < targets.length; i++) {
            state.write(`${nextLine}const ${names.target}${i} = ${names.targetsAlias}[${i}];`);
        }

        // childNode variables prevent binding mutations from changing 
        // .childNode[1] returned value as it is a live list)
        for(let i = 0; i < bindings.length; i++) {
            const { element: { queryIndex }, type, index } = bindings[i];
            if(type !== 'child') continue;
            state.write(`${nextLine}const ${names.child}${i} = `);
            const varName = queryIndex === -1 ? rootVarName : `${names.target}${queryIndex}`;
            state.write(`${varName}.childNodes[${index}];`);
        }

        // bindings
        for(let i = 0; i < bindings.length; i++) {
            const { element: { queryIndex }, type, node, expr } = bindings[i];
            state.write(`${nextLine}`);

            if(!this[expr.type]) {
                throw new TypeError(`Unexpected AST Type "${expr.type}"`);
            }

            if(type === 'child') {
                state.write(`__compose(`);
                this.JSXExpressionContext(expr, state);
                state.write(`, ${names.child}${i});`);
            }
            else if(type === 'prop') {
                const varName = queryIndex === -1 ? rootVarName : `${names.target}${queryIndex}`;
                state.write(`${varName}`);
                // TODO: more property validation
                const propName = node.name.name;
                if(isValidName(propName)) {
                    state.write(`.${propName}`);
                }
                else {
                    state.write(`["${propName}"]`);
                }

                /* expression */
                state.write(` = (`); // do we need (...)? 
                this.JSXExpressionContext(expr, state);
                state.write(`);`);
            }
            else {
                const message = `Unexpected binding type "${type}", expected "child" or "prop"`;
                throw new Error(message);
            }
        }
    }

    JSXExpressionContext(node, state) {
        // Expression can have a nested template, 
        // so we push a context entry for the expression 
        this.context.push(new ExpressionContext(node));
        this[node.type](node, state);
        this.context.pop();
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
            else if(child.type === 'JSXExpressionContainer' && 
                child.expression.type === 'JSXEmptyExpression') {
                adj--; // skip this node
            }
            else {
                if(!this[child.type]) {
                    throw new TypeError(`Unexpected AST Type "${child.type}"`);
                }
                this[child.type](child, i + adj);
            }
        }
    }

    JSXExpressionContainer(node, index) {
        if(node.expression.type === 'JSXEmptyExpression') {
            console.log('is empty!');
            return;
        }
        this.current.bind('child', node, node.expression, index);
    }

    JSXText() { /* no-op */ }

    JSXEmptyExpression() { /* no-op */ }
}

export class HtmlGenerator extends Generator {

    constructor(config) {
        super();
        this.childReplace = config?.childReplace ?? `<!--0-->`;
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
