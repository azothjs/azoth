import { generate } from 'astring';
import { ExpressionContext, TemplateContext } from './context/index.js';
import { Stack } from './Stack.js';
import isValidName from 'is-valid-var-name';
import { HtmlGenerator } from './HtmlGenerator.js';
import { Generator } from './Base.js';

function getNextLine(state) {
    const { indent, lineEnd, } = state;
    const indentation = indent.repeat(state.indentLevel);
    return `${lineEnd}${indentation}`;
}

export class AzothGenerator extends Generator {
    templates = [];

    constructor() {
        super();
        const generator = new HtmlGenerator();
        this.htmlGenerator = node => generate(node, {
            // TODO: ...config.html 
            generator,
            // sourceMap: new SourceMapGenerator()
        });
    }

    // (module) template context
    context = new Stack();
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
            node.argument.isReturnArg = true;
            this.JSXElement(node.argument, state);
            return;
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

        // Recursive analysis of jsx: feed root node to JSXElement 
        this[node.type](node, state);
        // generate html
        template.generateHtml();
        // generate javascript
        this.InjectionWrapper(template, state);

        this.context.pop();
    }

    InjectionWrapper(template, state) {
        const { targets, node } = template;

        if(!targets.length) {
            this.TemplateRenderer(template, state);
            state.write(`.root`);
            return;
        }

        let nextLine = getNextLine(state);

        const useIIFEWrapper = !node.isReturnArg;
        if(useIIFEWrapper) {
            state.write(`(() => {`);
            state.indentLevel++;
            nextLine = getNextLine(state);
            state.write(nextLine);
        }

        this.JSXDomLiteral(template, state);

        state.write(`${nextLine}return __root_${template.id};`);
        
        if(useIIFEWrapper) {
            state.indentLevel--;
            nextLine = getNextLine(state);
            state.write(`${nextLine}})()`);
        }
    }

    TemplateRenderer({ id, isSingleElementRoot }, state) {
        state.write(`t${id}(`);
        if(!isSingleElementRoot) state.write('true'); // fragment
        state.write(`)`);
    }

    JSXDomLiteral(template, state) {
        const { id, targets, bindings } = template;
        
        const { indent, lineEnd, } = state;
        let indentation = indent.repeat(state.indentLevel);
        let nextLine = `${lineEnd}${indentation}`;

        // template service renderer call
        const rootVarName = `__root_${id}`;
        state.write(`const { root: ${rootVarName}, targets: __targets }`);
        state.write(` = `);
        
        this.TemplateRenderer(template, state);
        state.write(';');

        // target variables
        for(let i = 0; i < targets.length; i++) {
            state.write(`${nextLine}const __target${i} = __targets[${i}];`);
        }

        // childNode variables prevent binding mutations from changing 
        // .childNode[1] returned value as it is a live list)
        for(let i = 0; i < bindings.length; i++) {
            const { element: { queryIndex }, type, index } = bindings[i];
            if(type !== 'child') continue;
            state.write(`${nextLine}const __child${i} = `);
            const varName = queryIndex === -1 ? rootVarName : `__target${queryIndex}`;
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
                state.write(`, __child${i});`);
            }
            else if(type === 'prop') {
                const varName = queryIndex === -1 ? rootVarName : `__target${queryIndex}`;
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
        // New context as expressions may have nested template
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
            return;
        }
        this.current.bind('child', node, node.expression, index);
    }

    JSXText() { /* no-op */ }

    JSXEmptyExpression() { /* no-op */ }
}


