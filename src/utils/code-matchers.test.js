import { beforeEach, test } from 'vitest';
import { toMatchCode } from './code-matchers';
const _ = () => {};

const code = `
    (x, y) => \`<span>*\${x + y}</span>\`;
`.trim();

beforeEach(async ({ expect }) => {
    expect.extend(toMatchCode);
});

test('named function', ({ expect }) => {
    function template() {
        (x, y) => `<span>*${x + y}</span>`;
    }   
    expect(template).toMatchCode(code);
});

test('arrow with block', ({ expect }) => {
    const template = () => {
        (x, y) => `<span>*${x + y}</span>`;
    };
    expect(template).toMatchCode(code);
});

test('arrow no block formatted as expression (no-semi)', ({ expect }) => {
    const template = () => (x, y) => `<span>*${x + y}</span>`;
    expect(template).toMatchCode(code.slice(0, -1)); // no semicolon
});

test('custom matcher works with not', ({ expect }) => {
    function template() {
        (a) => `<span>${a}</span>`;
    }
    expect(template).not.toMatchCode(code);
});

test('indentation normalized for multiline', ({ expect }) => {
    function template() {
        const obj = {
            name: 'bob',
            age: 12
        };
        const template = () => `<span>hello</span>`;
    }
         
    const expected = `const obj = {
    name: 'bob',
    age: 12
};
const template = () => \`<span>hello</span>\`;
    `.trim();
    
    expect(template).toMatchCode(expected);
});

