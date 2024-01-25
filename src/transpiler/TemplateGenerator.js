import { generate } from 'astring';
import { HtmlGenerator } from './HtmlGenerator.js';
import { Generator } from './GeneratorBase.js';
import isValidName from 'is-valid-var-name';
import { ROOT_PROPERTY, TARGETS_PROPERTY } from '../azoth/renderer.js';
import { Analyzer } from './Analyzer.js';

function getNextLine(state) {
    const { indent, lineEnd, } = state;
    const indentation = indent.repeat(state.indentLevel);
    return `${lineEnd}${indentation}`;
}

export class TemplateGenerator extends Generator {
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

    JSXFragment(node, state) {
        this.JSXTemplate(node, state, true);
    }

    JSXElement(node, state) {
        this.JSXTemplate(node, state);
    }

    //  virtual AST type for overall jsx template
    JSXTemplate(node, state) {
        const analyzer = new Analyzer(node);
        const template = analyzer.generateTemplate(this.htmlGenerator);
        this.templates.push(template);

        // generate javascript
        this.InjectionWrapper(template, state);
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

    InjectionWrapper(template, state) {
        const { boundElements, node } = template;

        if(!boundElements.length) {
            this.TemplateRenderer(template, state);
            state.write(`.${ROOT_PROPERTY}`);
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

    TemplateRenderer({ id, isDomFragment }, state) {
        state.write(`t${id}(`);
        if(isDomFragment) state.write('true'); // fragment
        state.write(`)`);
    }

    JSXDomLiteral(template, state) {
        const { id, boundElements, bindings } = template;
        
        const { indent, lineEnd, } = state;
        let indentation = indent.repeat(state.indentLevel);
        let nextLine = `${lineEnd}${indentation}`;

        // template service renderer call
        const rootVarName = `__root_${id}`;
        state.write(`const { ${ROOT_PROPERTY}: ${rootVarName}, ${TARGETS_PROPERTY}: __targets }`);
        state.write(` = `);
        this.TemplateRenderer(template, state);
        state.write(';');

        // target variables
        for(let i = 0; i < boundElements.length; i++) {
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

    // process javascript in {...} exprs,
    // stack context to support nested template,
    // recursive template processing ftw!
    JSXExpressionContext(node, state) {
        this[node.type](node, state);
    }

}


