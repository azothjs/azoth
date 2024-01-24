import { generate } from 'astring';
import { ExpressionContext, TemplateContext } from './context/index.js';
import { HtmlGenerator } from './HtmlGenerator.js';
import { Generator } from './GeneratorBase.js';
import { Stack } from './context/Stack.js';

export class Analyzer extends Generator {
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

    /* Analyzer */


    /*  Virtual method to create template context, represents
        missing overall "template" syntax marker in jsx.
        - Creates TemplateContext to track and analyze jsx chunk
        - use the template to generate the html with binding replacements
        - generate JavaScript to inject in place of the jsx
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

    JSXExpressionContext(node, state) {
        // New context as expressions may have nested template
        this.context.push(new ExpressionContext(node));
        this[node.type](node, state);
        this.context.pop();
    }

    JSXFragment(node) {
        if(this.current.node === node) {
            this.current.pushElement(node);
            this.JSXOpenFragment(node);
            this.JSXChildren(node);
            this.current.popElement();
        }
        else {
            // extraneous fragment in fragment,
            // jsx children will correctly flatten indexes.
            // maybe meta-data fragment attributes at some future point...
            this.JSXChildren(node);
        }
    }

    JSXElement(node) {
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


