export function compile(ast, renderer) {
    const { expressions, quasis } = ast.quasi;
    const bindings = [];
    return `() => {${compileExpressions(expressions)}${compileBindings(bindings)}
    const __fn = () => {${!hasItems(bindings) 
        ? `
        return ${renderer}().root;` 
        : `
        const { root, nodes } = ${renderer}();
        bind(nodes);
        return root;`}
    };
    return __fn
}`;
}

function compileExpressions(expressions) {
    if(!expressions || expressions.length === 0) return '';
}

const hasItems = arr => arr?.length > 0;

function compileBindings(bindings) {
    if(!hasItems(bindings)) return '';
}

function compileNoBindingsRender() {
    return `    const __fn = () => {
    
    `;}