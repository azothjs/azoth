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

const NO_IIFE_MODE = 'no-iife';

const azothGenerator = {
    DomTemplateLiteral(node, state) {

        const shouldWrap = node.mode !== NO_IIFE_MODE;
        const indent = state.indent.repeat(state.indentLevel);
        if(shouldWrap) {
            state.write(`(() => `);
            ++state.indentLevel;
        }
        state.write('{');
        state.write(state.lineEnd);

        this.writeTemplate(node, state);

        if(shouldWrap) {
            state.write(`${indent}})()`);
            --state.indentLevel;
        }
        else {
            state.write(`${indent}}`);
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
            state.indentLevel++;
            node.body.mode = NO_IIFE_MODE;
        }
        this.superArrowFunctionExpression(node, state);

        if(isDomLiteral) state.indentLevel--;
    },
    
    ReturnStatement(node, state) {
        // if(node.argument?.type === 'DomTemplateLiteral') {
        //     node.argument.mode = NO_IIFE_MODE;
        //     node = {
        //         type: 'BlockStatement',
        //         body: [node.argument]
        //     };
        // }
        this.superReturnStatement(node, state);
    },


    writeTemplate(node, state) {
        const { html, bindings, expressions } = node;
        const { lineEnd: lE } = state;
        
        const indent = state.indent.repeat(state.indentLevel);
        // renderer
        state.write(`${indent}const __renderer = `);
        state.write(`__makeRenderer(\`${html}\`);${lE}`);

        const { length } = bindings;
        if(!length) {
            state.write(`${indent}return __renderer().__root;${lE}`);
        }
        else {
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
            state.write(`${indent}return __root;${lE}`);
        }

    }
};
