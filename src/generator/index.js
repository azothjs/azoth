import { GENERATOR, generate } from 'astring';

export function azothGenerate(ast, config) {
    return generate(ast, {
        ...config,
        generator: {
            ...GENERATOR,
            superArrowFunctionExpression: GENERATOR.ArrowFunctionExpression,
            superReturnStatement: GENERATOR.ReturnStatement,
            ...azothGenerator,
        },
    });
}

const MODE_IIFE = 'iife';
const MODE_BLOCK = 'block';
const MODE_INLINE = 'inline';

const azothGenerator = {
    DomTemplateLiteral(node, state) {
        const { lineEnd: lE } = state;
        const indent = state.indent.repeat(state.indentLevel);
        const mode = node.mode ?? MODE_IIFE;

        if(mode === MODE_IIFE) {
            state.write(`(() => `);
        }
        if(mode !== MODE_INLINE) {
            ++state.indentLevel;
            state.write(`{`);
        }
        state.write(lE);

        this.writeTemplate(node, state);
        
        if(mode !== MODE_INLINE) state.write(lE);
        if(mode !== MODE_BLOCK) state.write(indent);
        if(mode !== MODE_INLINE) state.write('}');
        if(mode === MODE_IIFE) {
            state.write(`)()`);
        }
        if(mode !== MODE_INLINE) {
            --state.indentLevel;
        }
    },

    PropertyBinding({ queryIndex, property }, state) {
        // TODO: add "computed" to node so we know if [] required
        state.write(`__targets[${queryIndex}].${property}`);
    },

    ChildBinding({ queryIndex, childIndex }, state) {
        state.write(`__targets[${queryIndex}].childNodes[${childIndex}].textContent`);
    },

    ArrowFunctionExpression(node, state) {
        const isDomLiteral = node.body?.type === 'DomTemplateLiteral';
        if(isDomLiteral) {
            node.body.mode = MODE_BLOCK;
        }
        this.superArrowFunctionExpression(node, state);
    },
    
    ReturnStatement(node, state) {
        if(node.argument?.type === 'DomTemplateLiteral') {
            node = node.argument;
            node.mode = MODE_INLINE;
            this.DomTemplateLiteral(node, state);
        }
        else {
            this.superReturnStatement(node, state);
        }
    },

    writeTemplate(node, state) {
        const { html, bindings, expressions } = node;
        const { lineEnd: lE, indent: indentUnit, indentLevel } = state;
        const { length } = bindings;
        const indent = indentUnit.repeat(indentLevel);
        
        state.write(indent);
        state.write(length > 0 ? `const __renderer = ` : `return `);
        state.write(`__makeRenderer(\`${html}\`)`);

        if(length === 0) {
            state.write(`().__root;`);
        }
        else {
            state.write(`;${lE}`);
            state.write(`${indent}const { __root, __targets } = __renderer();${lE}`);
                    
            for(let i = 0; i < length; i++) {
                const binding = bindings[i];
                const expression = expressions[i];
                        // const interpolator = node.interpolators[i];
                state.write(indent);
                this[binding.type](binding, state);
                state.write(` = `);
                this[expression.type](expression, state);
                state.write(`;${lE}`);
            }
            state.write(`${indent}return __root;`);
        }

    }
};
