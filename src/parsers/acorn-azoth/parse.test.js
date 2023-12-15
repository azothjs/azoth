/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
import { test, expect } from 'vitest';
import acornAz from './acorn-az.js';

const AzParser = Parser.extend(acornAz());
const parse = code => AzParser.parse(code, {
    ecmaVersion: 'latest',
});

test('normal template still works', () => {

});