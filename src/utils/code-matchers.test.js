import { expect, test } from 'vitest';
import './code-matchers';
const _ = () => {};

const code = `
    (x, y) => \`<span>*\${x + y}</span>\`;
`.trim();

test('named function', () => {
    function template() {
        (x, y) => `<span>*${x + y}</span>`;
    }   
    expect(template).toMatchCode(code);
});

test('arrow with block', () => {
    const template = () => {
        (x, y) => `<span>*${x + y}</span>`;
    };
    expect(template).toMatchCode(code);
});

test('arrow no block formatted as expression (no-semi)', () => {
    const template = () => (x, y) => `<span>*${x + y}</span>`;
    expect(template).toMatchCode(code.slice(0, -1)); // no semicolon
});

test('custom matcher works with not', () => {
    function template() {
        (a) => `<span>${a}</span>`;
    }
    expect(template).not.toMatchCode(code);
});

test('indentation normalized for multiline', () => {
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

