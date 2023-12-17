/* eslint-disable no-undef */
import { Node, Parser } from 'acorn';
import acornAz from '../parsers/acorn-azoth/acorn-az.js';
import { azothGenerate as generate } from './index.js';
import '../utils/code-matchers.js';
import { it } from 'vitest';

const AzParser = Parser.extend(acornAz());

const parse = code => {
    if(code.toBody) code = code.toBody();
    return AzParser.parse(code, {
        ecmaVersion: 'latest',
    });
};

export const json = {
    test: () => true,
    serialize(ast, config, indentation, depth, refs, printer) {
        return JSON.stringify(ast, null, 2);
    },
};

it('make renderer', ({ expect }) => {
    const code = () => {
        const renderer = __makeTemplate('html');
    }; 
    expect.addSnapshotSerializer(json);
    expect(parse(code)).toMatchFileSnapshot('./ast-snippets.json');
});
