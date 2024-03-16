import { Generator, writeNextLine } from './GeneratorBase.js';
import { isValidESIdentifier } from 'is-valid-es-identifier';
import { generateWith } from '../compiler.js';

const OPENING_TYPES = {
    JSXOpeningElement: true,
    JSXOpeningFragment: true,
};

const OPENING_PROP_BY_TYPE = {
    JSXElement: 'openingElement',
    JSXFragment: 'openingFragment',
};

function getOpening(element) {
    const { type } = element;
    if(OPENING_TYPES[type]) return element;

    const prop = OPENING_PROP_BY_TYPE[type];
    if(prop) return element[prop];

    throw new TypeError(`Unexpected binding element type "${element.type}"`);
}

const ROOT = 'r';
const TARGETS = 'ts';
const TARGET = 't';
const VALUE = 'v';

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
        const { isStatic, node: root } = template;
        const { isComponent } = root;
        if(isStatic || isComponent) {
            if(isComponent) this.CreateElement(root, state);
            else if(isStatic) this.StaticRoot(template, state);
            return;
        }

        this.Targets(template, state);
        this.Bindings(template, state);
        this.Render(template, state);
    }

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
        // TODO: this should go in template module
        if(isDomFragment) state.write('true');
        state.write(`)`);
    }

    Targets(template, state) {
        const { boundElements, bindings, isBoundRoot } = template;
        const { length: elLength } = boundElements;

        state.write(`function targets(`);
        state.write(ROOT);
        if(elLength) state.write(`, ${TARGETS}`);
        state.write(') {');

        state.indentLevel++;
        writeNextLine(state);

        state.write(`return [`);
        for(let i = 0; i < bindings.length; i++) {
            const { element, type, index, node } = bindings[i];
            const { isRoot, queryIndex } = element;
            const varName = isRoot ? ROOT : `${TARGETS}[${queryIndex}]`;

            if(i !== 0) state.write(', ');

            if(type !== 'child') {
                state.write(`${varName}`);
                continue;
            }

            const opening = getOpening(element, node);
            state.write(`${varName}.childNodes`, opening.name);
            state.write(`[${index}]`, node);
        }
        state.write(`];`);

        state.indentLevel--;
        writeNextLine(state);
        state.write(`}`);
        state.write(state.lineEnd);
    }

    Render(template, state) {
        const { bindings } = template;

        const params = [];
        for(let i = 0; i < bindings.length; i++) {
            params.push(`${VALUE}${i}`);
        }

        state.write(`function render(${params.join(', ')}) {`);
        state.indentLevel++;
        writeNextLine(state);

        state.write(`const [root, bind] = makeTemplate(source);`);
        writeNextLine(state);
        state.write(`bind(${params.join(', ')});`);
        writeNextLine(state);
        state.write(`return root;`);

        state.indentLevel--;
        writeNextLine(state);
        state.write(`}`);
        state.write(state.lineEnd);
    }

    Bindings(template, state) {
        const { bindings } = template;

        state.write(`function bind(${TARGETS}) {`);
        state.indentLevel++;
        writeNextLine(state);

        const targets = [];
        const params = [];
        for(let i = 0; i < bindings.length; i++) {
            targets.push(`${TARGET}${i} = ${TARGETS}[${i}]`);
            params.push(`${VALUE}${i}`);
        }

        state.write(`const ${targets.join(', ')};`);
        writeNextLine(state);
        state.write(`return (${params.join(', ')}) => {`);
        state.indentLevel++;

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
        state.write(`};`);
        state.indentLevel--;
        writeNextLine(state);
        state.write(`}`);

        state.write(state.lineEnd);
    }

    Compose(node, expr, index, state) {
        state.write(`compose(`, node);
        state.write(`${TARGET}${index}, `, node);
        state.write(`${VALUE}${index}`, expr);
        // this[expr.type](expr, state);
        state.write(`);`);
    }

    ComposeElement(node, expr, index, state) {
        state.write(`composeElement(`, node);
        state.write(`${TARGET}${index}, `);
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
        const opening = openingElement ?? openingFragment;
        state.write(`${TARGET}${index}`, opening.name);
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
        state.write(`${VALUE}${index}`, expr);
        state.write(`;`);
    }
}

