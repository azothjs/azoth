import { expect, test } from 'vitest';
import './utils/code-matchers.js';
import { compile } from './compile.js';
const _ = () => {};

test('html extraction', () => {
    function template() {
        const template = () => _`<span>hello world</span>`;
    }

    /* eslint-disable no-undef */
    function expected() {
        const template = () => {
            const { __fragment } = __render0();
            return __fragment;
        };
        var __template0 = __makeRenderer(`<span>hello world</span>`);
    }
    /* eslint-enable no-undef */
    const compiled = compile(template.toCode());
         
    expect(compiled).toMatchCode(expected);
});
