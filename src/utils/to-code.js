import { generate, parse } from './ast';

Function.prototype.toCode = function() {
    const code = getBody(this);
    const ast = parse(code);
    return generate(ast);
};

Function.prototype.toBody = function() {
    return getBody(this);
};

function getBody(fn) {
    const trimmed = fn.toString().trim();
    const length = trimmed.length;

    const tryBlockArrow = trimmed.replace(/^\(\) => {/, '');
    if(tryBlockArrow.length !== length) {
        return tryBlockArrow
            .slice(0, -1)
            .trim();
    }

    const tryArrow = trimmed.replace(/^\(\) => /, '');
    if(tryArrow.length !== length) {
        return tryArrow.trim();
    }

    return trimmed
        .replace(`function ${fn.name}() {`, '')
        .slice(0, -1)
        .trim();
}

// Function.prototype.toAst = function() {
//     return parse(this.toCode());
// };

// Function.prototype.toExpr = function() {
//     return this.toAst().body[0].expression; 
// };

