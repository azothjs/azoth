/* eslint-disable no-fallthrough */
// Acorn source uses intentional fallthrough in switch/case

// Writing this plugin leaned on the acorn-jsx example.
// Plugin structure and acorn extending pretty much the same.
// Heavy refactoring on code structure, within the constraints
// of being an acorn parser extension and favoring some of
// it's existing style and paradigm.
//
// https://github.com/acornjs/acorn-jsx/blob/main/index.js

import { create } from './tokens.js';
import { Parser as AcornParser } from 'acorn';
import { extend } from './parser.js';

// The map to `acorn-az` tokens from `acorn` namespace objects.
const parserMap = new WeakMap();

export default () => azParserFactory;

function azParserFactory(Parser = AcornParser) {
    const acorn = Parser.acorn;
    if(parserMap.has(acorn)) return parserMap.get(acorn);
    
    const tokens = create(acorn);
    const AzParser = extend(Parser, tokens);
    parserMap.set(acorn, AzParser);
    return AzParser;
}

export function parse(input, options, startPos) {
    return azParserFactory().parse(input, options, startPos);
}

export function tokenizer(input, options, startPos) {
    return azParserFactory().tokenizer(input, options, startPos);
}

export function tokenize(input, options, startPos) {
    return [...tokenizer(input, options, startPos)];
}