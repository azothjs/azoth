import { generate } from 'astring';
import { HtmlGenerator } from './HtmlGenerator.js';
import { Generator, writeNextLine } from './GeneratorBase.js';
import { isValidESIdentifier } from 'is-valid-es-identifier';
import { Analyzer } from './Analyzer.js';

export class TemplateGenerator extends Generator {
    templates = [];

    constructor() {
        super();
        const generator = new HtmlGenerator();
        this.htmlGenerator = node => generate(node, { generator });
    }

    // Program(node, state) {
    //     console.log('Program');
    //     super.Program(node, state);
    // }

    JSXFragment(node, state) {
        this.JSXTemplate(node, state);
    }

    JSXElement(node, state) {
        this.JSXTemplate(node, state);
    }

    JSXTemplate(node, state) {
        const analyzer = new Analyzer(node);
        const template = analyzer.generateTemplate(this.htmlGenerator);
        this.templates.push(template);

        // Short-circuit templates
        const { isStatic, node: root } = template;
        const { isComponent, returnStatement } = root;
        if(isStatic || isComponent) {
            if(returnStatement) state.write(`return `, returnStatement);
            if(isComponent) this.CreateElement(root, state);
            else if(isStatic) this.StaticRoot(template, state);
            if(returnStatement) state.write(`;`);
            return;
        }

        this.InjectionWrapper(template, state);
    }

    // process javascript in {...} exprs,
    // supports nested template: recursive processing ftw!
    JSXExpressionContainer({ expression }, state) {
        this[expression.type](expression, state);
    }

    JSXIdentifier(identifier, state) {
        state.write(identifier.name, identifier);
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
        // custom handling for direct return of template jsx
        const type = node.argument?.type;
        if(type === 'JSXElement' || type === 'JSXFragment') {
            node.argument.returnStatement = node;
            this.JSXTemplate(node.argument, state);
            return;
        }

        super.ReturnStatement(node, state);
    }

    InjectionWrapper(template, state) {
        const returnStatement = template.node.returnStatement;
        const useIIFEWrapper = !returnStatement;

        if(useIIFEWrapper) {
            state.write(`(() => {`);
            state.indentLevel++;
            writeNextLine(state);
        }

        this.DomLiteral(template, state);
        writeNextLine(state);
        state.write(`return `, returnStatement);
        state.write(`__root;`, template.node);

        if(useIIFEWrapper) {
            state.indentLevel--;
            writeNextLine(state);
            state.write(`})()`);
        }
    }

    StaticRoot(template, state) {
        this.TemplateRenderer(template, state);
        if(!template.isEmpty) state.write(`[0]`, template.node); // dom root
    }

    TemplateRenderer({ id, isEmpty, isDomFragment, node }, state) {
        if(isEmpty) {
            state.write('null', node);
            return;
        }
        state.write(`t${id}`, node);
        state.write(`(`);
        if(isDomFragment) state.write('true');
        state.write(`)`);
    }

    DomLiteral(template, state) {
        const { boundElements, bindings, node } = template;

        // template service renderer call
        const hasTargets = !!boundElements.length;
        state.write(hasTargets ? `const [__root, __targets] = ` : `const __root = `);
        this.TemplateRenderer(template, state);
        state.write(hasTargets ? ';' : '[0];', node);

        // target variables
        for(let i = 0; i < boundElements.length; i++) {
            const boundElement = boundElements[i];
            const opening = boundElement.openingElement || boundElement.openFragment;
            writeNextLine(state);
            state.write(`const __target${i} =`);
            state.write(`__targets[${i}]`, opening?.name);
            state.write(`;`);
        }
        // sequential tasks before bindings generation below,
        // variables prevent downstream binding mutations from 
        // changing index because childNodes is live list.
        for(let i = 0; i < bindings.length; i++) {
            const { element, type, index, node } = bindings[i];
            const { queryIndex } = element;
            if(type !== 'child') continue;
            const varName = queryIndex === -1 ? `__root` : `__target${queryIndex}`;
            const opening = element.openingElement ?? element.openingFragment;
            writeNextLine(state);
            state.write(`const __child${i} = `);
            state.write(`${varName}.childNodes`, opening.name ?? opening);
            state.write(`[${index}]`, node);
            state.write(`;`);
        }

        // bindings
        for(let i = 0; i < bindings.length; i++) {
            const { element, type, node, expr } = bindings[i];
            writeNextLine(state);

            if(!this[expr.type]) {
                throw new TypeError(`Unexpected Binding expression AST type "${expr.type}"`);
            }

            if(node.isComponent) {
                this.ComposeElement(node, expr, i, state);
                continue;
            }
            if(type === 'child') {
                this.Compose(node, expr, i, state);
                continue;
            }
            if(type === 'prop') {
                this.BindingProp(node, expr, element, state);
                continue;
            }

            const message = `Unexpected binding type "${type}", expected "child" or "prop"`;
            throw new Error(message);
        }
    }

    Compose(node, expr, index, state) {
        state.write(`__compose(`, node);
        state.write(`__child${index}, `, node);
        this[expr.type](expr, state);
        state.write(`);`);
    }

    ComposeElement(node, expr, index, state) {
        state.write(`__composeElement(`, node);
        state.write(`__child${index}, `);
        this.CompleteElement(node, expr, state);
        state.write(`);`);
    }

    CreateElement(node, state) {
        state.write(`__createElement(`, node);
        this.CompleteElement(node, node.componentExpr, state);
        state.write(`)`);
    }

    CompleteElement({ props, slotFragment }, expr, state) {
        this[expr.type](expr, state);
        if(props?.length) {
            this.ComponentProps(props, state);
        }
        else if(slotFragment) state.write(`, null`);

        if(slotFragment) {
            state.write(', ');
            this.JSXTemplate(slotFragment, state);
        }
    }

    ComponentProps(props, state) {
        state.write(`, {`);
        for(let i = 0; i < props.length; i++) {
            const { node, expr } = props[i];
            // TODO: Dom lookup, JS .prop v['prop'], etc. 
            // refactor with code below
            state.write(` `);
            state.write(node.name.name, node.name);
            state.write(`: `);
            this[expr.type](expr, state);
            state.write(`,`);
        }
        state.write(` }`);
    }

    BindingProp(node, expr, element, state) {
        const { queryIndex, openingElement, openingFragment } = element;
        const varName = queryIndex === -1 ? `__root` : `__target${queryIndex}`;
        const opening = openingElement ?? openingFragment;
        state.write(`${varName}`, opening.name);
        // TODO: more property validation
        const identity = node.name;
        const propName = identity.name;
        // TODO: refactor with component props
        if(isValidESIdentifier(propName)) {
            state.write(`.`);
            state.write(propName, node.name);
        }
        else {
            state.write(`["`, node.name);
            state.write(propName, node.name);
            state.write(`"]`);
        }

        /* expression */
        state.write(` = (`);
        this[expr.type](expr, state);
        state.write(`);`);
    }
}
