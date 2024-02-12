import { GENERATOR } from 'astring';

// enable extending as es6 class
export function Generator() { }
Generator.prototype = GENERATOR;

export function getNextLine(state) {
    const { indent, lineEnd, } = state;
    const indentation = indent.repeat(state.indentLevel);
    return `${lineEnd}${indentation}`;
}

