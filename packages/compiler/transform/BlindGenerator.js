import { Generator, writeNextLine } from './GeneratorBase.js';
import { isValidESIdentifier } from 'is-valid-es-identifier';
import { generate as astring } from 'astring';
import { generateWith } from '../compiler.js';

const OPENING_PROP = {
    JSXElement: 'openingElement',
    JSXFragment: 'openingFragment',
};

const IS_OPENING = {
    JSXOpeningElement: true,
    JSXOpeningFragment: true,
};

export class BindGenerator extends Generator {
    static generate(template) {
        const generator = new BindGenerator(template);
        return generateWith(generator, template.node);
    }

    constructor(template) {
        super();
        this.template = template;
    }

    JSXFragment(_node, state) {
        this.JSXTemplate(state);
    }

    JSXElement(_node, state) {
        this.JSXTemplate(state);
    }

    JSXTemplate(state) {
        const { template } = this;
        // Short-circuit templates
        const { isStatic, bindings, node: root } = template;
        const { isComponent } = root;
        if(isStatic || isComponent) {
            if(isComponent) this.CreateElement(root, state);
            else if(isStatic) this.StaticRoot(template, state);
            return;
        }

        this.GetTargets(template, state);


        this.Bindings(template, state);


    }

    // process javascript in {...} exprs,
    // supports nested template: recursive processing ftw!
    JSXExpressionContainer({ expression }, state) {
        this[expression.type](expression, state);
    }

    JSXIdentifier(identifier, state) {
        state.write(identifier.name, identifier);
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

    GetTargets(template, state) {
        const { boundElements, bindings, node } = template;

        const hasTargets = !!boundElements.length;
        const params = hasTargets ? `root, targets` : `root`;
        state.write(`function getTargets(${params}) {`);
        state.indentLevel++;

        // target variables
        for(let i = 0; i < boundElements.length; i++) {
            const boundElement = boundElements[i];
            const opening = boundElement.openingElement || boundElement.openFragment;
            writeNextLine(state);
            state.write(`const target${i} = `);
            state.write(`targets[${i}]`, opening?.name);
            state.write(`;`);
        }

        const returnValues = [];
        for(let i = 0; i < bindings.length; i++) {
            const { element, type, index, node } = bindings[i];
            const { queryIndex } = element;
            const varName = queryIndex === -1 ? `root` : `target${queryIndex}`;
            if(type !== 'child') {
                returnValues.push(varName);
                continue;
            }

            let opening = null;
            if(IS_OPENING[element.type]) opening = element;
            else {
                const prop = OPENING_PROP[element.type];
                if(prop) opening = element[prop];
                else {
                    throw new TypeError(`Unexpected binding node type "${node.type}"`);
                }
            }

            const childVar = `child${i}`;
            returnValues.push(childVar);
            writeNextLine(state);
            state.write(`const ${childVar} = `);
            state.write(`${varName}.childNodes`, opening.name);
            state.write(`[${index}]`, node);
            state.write(`;`);
        }

        writeNextLine(state);
        state.write(`return [${returnValues.join(', ')}];`);

        state.indentLevel--;
        writeNextLine(state);
        state.write(`}`);
        state.write(state.lineEnd);
        writeNextLine(state);
    }

    Bindings(template, state) {
        const { boundElements, bindings, node } = template;


        const params = [];
        for(let i = 0; i < bindings.length; i++) {
            params.push(`p${i}`);
        }
        state.write(`function apply(${params.join(', ')}) {`);
        state.indentLevel++;
        writeNextLine(state);

        const returnStatement = template.node.returnStatement;


        // template service renderer call
        const hasTargets = !!boundElements.length;

        const vars = ['root'];
        for(let i = 0; i < bindings.length; i++) {
            vars.push(`t${i}`);
        }

        state.write(`const [${vars.join(', ')}] = getTargets();`);

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
                this.BindingProp(node, expr, i, element, state);
                continue;
            }

            const message = `Unexpected binding type "${type}", expected "child" or "prop"`;
            throw new Error(message);
        }

        state.indentLevel--;
        writeNextLine(state);
        state.write(`}`);
        state.write(state.lineEnd);
    }

    Compose(node, expr, index, state) {
        state.write(`compose(`, node);
        state.write(`t${index}, `, node);
        state.write(`p${index}`, expr);
        // this[expr.type](expr, state);
        state.write(`);`);
    }

    ComposeElement(node, expr, index, state) {
        state.write(`composeElement(`, node);
        state.write(`t${index}, `);
        this.CompleteElement(node, expr, state);
        state.write(`);`);
    }

    CreateElement(node, state) {
        state.write(`createElement(`, node);
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

    BindingProp(node, expr, index, element, state) {
        const { queryIndex, openingElement, openingFragment } = element;
        const varName = queryIndex === -1 ? `root` : `target${queryIndex}`;
        const opening = openingElement ?? openingFragment;
        state.write(`t${index}`, opening.name);
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
        state.write(` = `);
        // this[expr.type](expr, state);
        state.write(`p${index}`, expr);
        state.write(`;`);
    }
}
