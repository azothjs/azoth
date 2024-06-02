import { generate } from 'astring';
import { HtmlGenerator } from './HtmlGenerator.js';
import { Generator } from './GeneratorBase.js';
import { Analyzer } from './Analyzer.js';
import { BIND } from './Template.js';

export const templateModule = `virtual:azoth-templates`;

export class Transpiler extends Generator {
    templates = [];
    uniqueIds = new Set();

    constructor() {
        super();
        const generator = new HtmlGenerator();
        this.htmlGenerator = node => generate(node, { generator });
    }

    Program(node, state) {
        // "import" line placeholders added for sourcemap convenience
        state.write('\n');
        state.write('\n');

        super.Program(node, state);

        const imports = this.getImports();
        if(imports.length === 2) state.output = state.output.replace('\n\n', imports.join(''));
        if(imports.length === 1) state.output = state.output.replace('\n\n', imports[0] + '\n');
    }

    getImports() {
        const { templates, uniqueIds } = this;
        const namedImports = new Set();

        for(let template of templates) {
            for(let namedImport of template.imports) {
                namedImports.add(`__${namedImport}`);
            }
        }

        const imports = [];
        if(namedImports.size) {
            imports.push(`import { ${[...namedImports].join(', ')} } from 'azoth/runtime';\n`);
        }

        if(uniqueIds.size) {
            const ids = [...uniqueIds];
            const params = new URLSearchParams(ids.map(id => ['id', id]));
            const names = ids.map(id => `t${id}`).join(', ');
            imports.push(`import { ${names} } from '${templateModule}?${params.toString()}';\n`);
        }

        return imports;
    }

    JSXFragment(node, state) {
        this.JSXTemplate(node, state);
    }

    JSXElement(node, state) {
        this.JSXTemplate(node, state);
    }

    JSXTemplate(node, state) {
        const analyzer = new Analyzer(node);
        const template = analyzer.template;

        const { templates, uniqueIds } = this;
        templates.push(template);

        // Short-circuit templates
        const { node: root } = template;
        const { isComponent } = root;
        if(isComponent) {
            this.CreateElement(root, state, true);
            return;
        }

        if(template.id && !uniqueIds.has(template.id)) uniqueIds.add(template.id);

        this.DomLiteral(template, state);
    }

    // process javascript in {...} exprs,
    // supports nested template: recursive processing ftw!
    JSXExpressionContainer({ expression }, state) {
        this[expression.type](expression, state);
    }

    JSXIdentifier(identifier, state) {
        state.write(identifier.name, identifier);
    }

    DomLiteral(template, state) {
        const { id, boundElements, bindings, node, isEmpty } = template;

        // template service renderer call
        const hasTargets = !!boundElements.length;
        if(isEmpty) {
            state.write('null', node);
            return;
        }
        state.write(`t${id}(`, node);

        for(let i = 0; i < bindings.length; i++) {
            const { node, expr } = bindings[i];
            if(i !== 0) state.write(`,`);

            if(!this[expr.type]) {
                throw new TypeError(`Unexpected Binding expression AST type "${expr.type}"`);
            }

            if(node.isComponent) {
                this.ComposeComponent(node, state);
                continue;
            }

            this[expr.type](expr, state);
        }

        state.write(`)`);
    }

    ComposeComponent({ componentExpr: expr, props, slotFragment }, state) {
        state.write(`[`);
        this.CompleteElement({ props, slotFragment }, expr, state);
        state.write(`]`);
    }

    CreateElement(node, state) {
        state.write(`__rC(`, node);
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
            const { node, expr, type } = props[i];
            // TODO: Dom lookup, JS .prop v['prop'], etc. 
            // refactor with code below
            state.write(` `);
            if(type === BIND.SPREAD) {
                state.write(`...`);
            }
            else {
                state.write(node.name.name, node.name);
                state.write(`: `);
            }
            this[expr.type](expr, state);
            state.write(`,`);
        }
        state.write(` }`);
    }
}
