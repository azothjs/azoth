import { diffStringsUnified as diff } from 'jest-diff';
import { expect } from 'vitest';
import { parse, generate } from './ast.js';
import './to-code.js';

const tryParse = (name, code) => {
    try {
        const ast = parse(code);
        return generate(ast);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log('FAILED PARSE:', name, '\nERROR:', err, '\nCODE:\n', code);
        // TODO: why did I not throw this?
        // throw err;
    }
};

function getCode(value, name) {
    if(typeof value === 'function') {
        return { value: value.toCode(), type: 'function' };
    }
    else if(typeof value === 'string') {
        return { 
            value: tryParse(name, value), 
            type: 'string' 
        };
    } 
    return { value: generate(value), type: 'ast' };
}

function codeEqual(received, expected) {
    
    received = getCode(received, 'received');
    expected = getCode(expected, 'expected');
    
    const pass = received.value === expected.value;

    const message = () => {
        const hint = this.utils.matcherHint('toMatchCode',
            `received:${received.type}`, 
            `expected:${expected.type}`, {
                isNot: this.isNot,
                promise: this.promise,
            });

        const diffString = diff(expected.value, received.value, {
            expand: this.expand,
        });  

        return `${hint}\n\n${diffString}\n`;
    };

    return { 
        message, 
        pass 
    };

}

expect.extend({
    toMatchCode: codeEqual,
});
