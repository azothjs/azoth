
const declareVariable = kind => ({ name, id, init }) => {
    if(name) id = identifier(name);
    return {
        type: 'VariableDeclaration',
        declarations: [{
            type: 'VariableDeclarator',
            id,
            init
        }],
        kind
    };
};

export const declareConst = declareVariable('const');
export const declareVar = declareVariable('var');

export const property = ({ key, value = key }) => {
    return {
        type: 'Property',
        method: false,
        shorthand: true,
        computed: false,
        key,
        kind: 'init',
        value
    };
};

export function identifier(name) {
    return { type: 'Identifier', name };
}

const from = value => typeof value === 'string' ? `'${value}'` : `${value}`;

export function literal({ value, raw = from(value) }) {
    return { type: 'Literal', value, raw };
}

export function blockStatement({ body = [] }) {
    return {
        type: 'BlockStatement',
        body
    };
}

export function returnStatement({ arg }) {
    return {
        type: 'ReturnStatement',
        argument: arg
    };
}

export function arrayExpression({ elements }) {
    return {
        type: 'ArrayExpression',
        elements
    };
}

export function expressionStatement({ expression }) {
    return {
        type: 'ExpressionStatement',
        expression
    };
}

export function parenthesizedExpression({ expression }) {
    return {
        type: 'ParenthesizedExpression',
        expression
    };
}

export function memberExpression({ name, object, property, computed = false }) {
    if(name) object = identifier(name);
    return {
        type: 'MemberExpression',
        object,
        property,
        computed
    };
}

// <callee>(<args>)
export function callExpression({ callee, name, args = [] }) {
    if(name) callee = identifier(name);
    return {
        type: 'CallExpression',
        callee,
        arguments: args
    };
}

// <object>.<property>(<arg>)
export function callMethod({ object, property, arg }) {
    return callExpression({
        callee: memberExpression({ 
            object, 
            property
        }),
        args: [arg]
    });
}

// () => <body>
// () => {<block>}
export const arrowFunctionExpression = ({ body, block, params = [] }) => {
    if(block) { body = { type: 'BlockStatement', body: block }; }

    return {
        type: 'ArrowFunctionExpression',
        id: null,
        generator: false,
        expression: false,
        params,
        body
    };
};

export const specifier = name => ({
    type: 'Import Specifier',
    imported: identifier(name),
    local: identifier(name)
});

export function replaceStatements(block, match, statements) {
    const index = block.findIndex(n => n === match);
    block.splice(index, 1, ...statements);
    return;
}

const isBlock = node => node.type === 'Program' || node.type === 'BlockStatement'; 

export function addStatementsTo(node, statements, { returnBody = false } = {}) {
    let body = isBlock(node) ? node : node.body;
    if(isBlock(body)) {
        spliceStatements(body.body, statements);
    } else {
        node.body = replaceBody(body, statements, returnBody);
    }
}

function spliceStatements(body, statements) {
    statements.forEach(({ statements, index }) => {
        body.splice(index, 0, ...statements);
    });
}

function replaceBody(body, statements, returnBody) {
    statements = statements
        .reverse()
        .reduce((all, s) => all.concat(s.statements), []);
    if(returnBody) statements.push(returnStatement({ arg: body }));
    return blockStatement({ body: statements });
}