import { GENERATOR, generate } from 'astring';
import { getParser as parseTemplate } from '../parsers/acorn-azoth/template-parser.js';

export function azothGenerate(ast, config) {
    const { ArrowFunctionExpression } = GENERATOR;
    
    return generate(ast, {
        ...config,
        generator: {
            ...GENERATOR,
            superArrowFunctionExpression: ArrowFunctionExpression,
            ...azothGenerator,
        },
    });
}

const { ArrowFunctionExpression } = GENERATOR;

const azothGenerator = {
    AzothTemplate(node, state) {
        node.name = '_';
        const { html } = parseTemplate(node.template);
        const { lineEnd: lE, /*, writeComments */ } = state;
        
        let indent = state.indent;
        const addIndent = () => (++state.indentLevel, setIndent());
        const setIndent = () => indent = indent = state.indent.repeat(state.indentLevel);
        const removeIndent = () => (--state.indentLevel, setIndent());

        state.write(`(() => {${state.lineEnd}`, node);
        addIndent();
        
        // renderer
        state.write(`${indent}const __renderer = __makeRenderer(`, node);
        state.write(`\``, node.template);
        // TODO: segment into template parts for source map
        state.write(`${html}`);
        state.write(`\``);
        state.write(`);${lE}`);

        // rendering function
        state.write(`${indent}const fn = () => {${lE}`, node);
        {
            addIndent();
            state.write(`${indent}return __renderer().__root;${lE}`, node);
            removeIndent();
        }       
        state.write(`${indent}};${lE}`);

        state.write(`${indent}return fn;${lE}`);

        
        removeIndent();
        state.write(`})()`);
        
    
    },

    AzothBinding(node, state) {
        console.log('Azoth Binding', node.binder);
    },

    ArrowFunctionExpression(node, state) {
        if(node.body?.type === 'AzothTemplate') {
            // will optimize...
        }
        this.superArrowFunctionExpression(node, state);
    }
    // TODO: these can be optimized as well in some cases
    // FunctionExpression
    // FunctionDeclaration
};
