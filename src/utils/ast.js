import { parse as acornParse } from 'acorn';
import { generate as astringGenerate } from 'astring';

const ACORN_DEFAULTS = {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
};

export function parse(source, options = {}) {
    return acornParse(source, { ...ACORN_DEFAULTS, ...options });
}

const ASTRING_DEFAULTS = { 
    indent: '    '
};

export function generate(ast, options = {}) {
    return astringGenerate(ast, { ...ASTRING_DEFAULTS, ...options });
}