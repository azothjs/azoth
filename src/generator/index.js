import { GENERATOR, generate } from 'astring';

export function azothGenerate(ast, config) {
    const { ArrowFunctionExpression } = GENERATOR;
    
    return generate(ast, {
        ...config,
        generator: {
            ...GENERATOR,
            ...azothGenerator,
        },
    });
}

const { ArrowFunctionExpression } = GENERATOR;

const azothGenerator = {
    DomTemplateLiteral({ html, bindings, expressions, interpolators }, state) {
        const { lineEnd: lE } = state;
        
        let indent = state.indent;
        const addIndent = () => (++state.indentLevel, setIndent());
        const setIndent = () => indent = indent = state.indent.repeat(state.indentLevel);
        const removeIndent = () => (--state.indentLevel, setIndent());

        state.write(`(() => {${state.lineEnd}`);
        addIndent();
        
        // renderer
        state.write(`${indent}const __renderer = `);
        state.write(`__makeRenderer(\`${html}\`);${lE}`);

        // rendering function
        state.write(`${indent}const fn = () => {${lE}`);
        {
            addIndent();

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

            
            removeIndent();
        }       
        state.write(`${indent}};${lE}`);

        state.write(`${indent}return fn;${lE}`);

        
        removeIndent();
        state.write(`})()`);
        
    
    },

    PropertyBinding({ queryIndex, property }, state) {
        // TODO: add "computed" to node so we know if [] required
        state.write(`__targets[${queryIndex}].${property}`);
    },

    ChildBinding({ queryIndex, childIndex }, state) {
        state.write(`__targets[${queryIndex}].childNodes[${childIndex}].textContent`);
    },

    // ArrowFunctionExpression(node, state) {
    //     if(node.body?.type === 'AzothTemplate') {
    //         // will optimize...
    //     }
    //     this.superArrowFunctionExpression(node, state);
    // }
    // // TODO: these can be optimized as well in some cases
    // // FunctionExpression
    // // FunctionDeclaration
};
