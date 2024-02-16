import { generate } from 'astring';
import { HtmlGenerator } from './HtmlGenerator.js';
import { Generator, getNextLine } from './GeneratorBase.js';
import isValidName from 'is-valid-var-name';
import { Analyzer } from './Analyzer.js';

export class TemplateGenerator extends Generator {
    templates = [];

    constructor() {
        super();
        this.htmlGenerator = node => generate(node, {
            generator: new HtmlGenerator(),
        });
    }

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

        const { isStatic, node: root } = template;

        // Short-circuit templates
        if(root.isComponent) {
            return this.ComponentRoot(root, state);
        }
        if(isStatic) {
            return this.StaticRoot(root, template, state);
        }

        this.InjectionWrapper(template, state);
    }

    // process javascript in {...} exprs,
    // supports nested template: recursive processing ftw!
    JSXExpressionContainer({ expression }, state) {
        this[expression.type](expression, state);
    }

    JSXIdentifier(identifier, state) {
        state.write(identifier.name);
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
            node.argument.isReturnArg = true;
            this.JSXTemplate(node.argument, state);
            return;
        }

        super.ReturnStatement(node, state);
    }

    InjectionWrapper(template, state) {
        const useIIFEWrapper = !template.node.isReturnArg;
        let nextLine = getNextLine(state);

        if(useIIFEWrapper) {
            state.write(`(() => {`);
            state.indentLevel++;
            nextLine = getNextLine(state);
            state.write(nextLine);
        }

        this.DomLiteral(template, state);
        state.write(`${nextLine}return __root;`);

        if(useIIFEWrapper) {
            state.indentLevel--;
            nextLine = getNextLine(state);
            state.write(`${nextLine}})()`);
        }
    }

    ComponentRoot(node, state) {
        const { isReturnArg, componentExpr, slotFragment } = node;
        if(isReturnArg) state.write(`return `);

        const expr = componentExpr;
        state.write(`__createElement(`);
        this[expr.type](expr, state);
        this.ComponentProps(node, state, !!slotFragment);
        if(slotFragment) {
            state.write(', ');
            this.JSXTemplate(slotFragment, state);
        }
        state.write(`)`);

        if(isReturnArg) state.write(`;`);
    }

    StaticRoot({ isReturnArg }, template, state) {
        if(isReturnArg) state.write(`return `);
        this.TemplateRenderer(template, state);
        if(!template.isEmpty) state.write(`[0]`); // dom root
        if(isReturnArg) state.write(`;`);
    }

    TemplateRenderer({ id, isEmpty, isDomFragment }, state) {
        if(isEmpty) {
            state.write('null');
            return;
        }
        state.write(`t${id}(`);
        if(isDomFragment) state.write('true');
        state.write(`)`);
    }

    DomLiteral(template, state) {
        const { boundElements, bindings } = template;
        const { indent, lineEnd, } = state;
        const indentation = indent.repeat(state.indentLevel);
        const nextLine = `${lineEnd}${indentation}`;

        // template service renderer call
        const hasTargets = !!boundElements.length;
        state.write(hasTargets ? `const [__root, __targets] = ` : `const __root = `);
        this.TemplateRenderer(template, state);
        state.write(hasTargets ? ';' : '[0];');

        // target variables
        for(let i = 0; i < boundElements.length; i++) {
            state.write(`${nextLine}const __target${i} = __targets[${i}];`);
        }
        // sequential tasks before bindings generation below,
        // variables prevent downstream binding mutations from 
        // changing index because childNodes is live list.
        for(let i = 0; i < bindings.length; i++) {
            const { element: { queryIndex }, type, index } = bindings[i];
            if(type !== 'child') continue;
            const varName = queryIndex === -1 ? `__root` : `__target${queryIndex}`;
            state.write(`${nextLine}const __child${i} = ${varName}.childNodes[${index}];`);
        }

        // bindings
        for(let i = 0; i < bindings.length; i++) {
            const { element, type, node, expr } = bindings[i];
            state.write(`${nextLine}`);

            if(!this[expr.type]) {
                throw new TypeError(`Unexpected Binding expression AST type "${expr.type}"`);
            }

            if(node.isComponent) {
                this.Component(node, expr, i, state);
                continue;
            }

            if(type === 'child') {
                this.ChildNode(expr, i, state);
                continue;
            }

            if(type === 'prop') {
                this.BindingProp(node, expr, element.queryIndex, state);
                continue;
            }

            const message = `Unexpected binding type "${type}", expected "child" or "prop"`;
            throw new Error(message);
        }
    }

    Component(node, expr, index, state) {
        state.write(`__composeElement(`);
        this[expr.type](expr, state);
        state.write(`, __child${index}`);
        this.ComponentProps(node, state);
        if(node.slotFragment) {
            state.write(', ');
            this.JSXTemplate(node, state);
        }
        state.write(`);`);
    }

    ComponentProps({ props }, state, forceArgument) {
        if(!props?.length) {
            if(forceArgument) state.write(`, null`);
            return;
        }

        state.write(`, {`);
        for(let i = 0; i < props.length; i++) {
            const { node, expr } = props[i];
            // TODO: Dom lookup, JS .prop v['prop'], etc. 
            // refactor with code below
            state.write(` ${node.name.name}: `);
            this[expr.type](expr, state);
            state.write(`,`);
        }
        state.write(` }`);
    }

    BindingProp({ name }, expr, queryIndex, state) {
        const varName = queryIndex === -1 ? `__root` : `__target${queryIndex}`;
        state.write(`${varName}`);
        // TODO: more property validation
        const propName = name.name;
        // TODO: refactor with component props
        if(isValidName(propName)) {
            state.write(`.${propName}`);
        }
        else {
            state.write(`["${propName}"]`);
        }

        /* expression */
        state.write(` = (`); // do we need (...)? 
        this[expr.type](expr, state);
        state.write(`);`);
    }

    ChildNode(expr, i, state) {
        state.write(`__compose(`);
        this[expr.type](expr, state);
        state.write(`, __child${i});`);
    }
}
