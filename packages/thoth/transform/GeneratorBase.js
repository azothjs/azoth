import { GENERATOR } from 'astring';

// enables extending as es6 class
export function Generator() { }
Generator.prototype = GENERATOR;

export function writeNextLine(state) {
    const { indent, lineEnd, } = state;
    state.write(lineEnd);
    state.write(indent.repeat(state.indentLevel));
}
