import { GENERATOR, generate } from 'astring';
import { parse as parseTemplate } from '../parsers/template-parser.js';

export function azothGenerate(ast) {
    const { ArrowFunctionExpression } = GENERATOR;

    return generate(ast, {
        generator: {
            ...GENERATOR,
            superArrowFunctionExpression: ArrowFunctionExpression,
            ...azothGenerator,
        },
        // indent: '  '
    });
}

const { ArrowFunctionExpression } = GENERATOR;

const azothGenerator = {
    AzothTemplate(node, state) {
        const { html } = parseTemplate(node.template);
        const { lineEnd: lE, /*, writeComments */ } = state;
        
        let indent = state.indent;
        const addIndent = () => (++state.indentLevel, setIndent());
        const setIndent = () => indent = indent = state.indent.repeat(state.indentLevel);
        const removeIndent = () => (--state.indentLevel, setIndent());

        state.write(`(() =>${state.lineEnd}`);
        addIndent();
        
        state.write(`${indent}const __renderer = __makeRenderer(\`${html}\`);${lE}`);
        state.write(`${indent}const fn = () =>${lE}`);
        addIndent();
        state.write(`${indent}return __renderer();${lE}`);
        
        removeIndent();
        state.write(`${indent}};${lE}`);

        
        removeIndent();
        state.write(`)()`);
        
    
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
