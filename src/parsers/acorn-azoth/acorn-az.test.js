/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
import { test, expect } from 'vitest';
import acornAz from './acorn-az.js';

const JsxParser = Parser.extend(acornAz({ sigil: '_' }));
const tokenize = code => [
    ...JsxParser.tokenizer(code, {
        ecmaVersion: 'latest',
    })
].map(t => `${t.type.label}: ${t.value ?? ''}`);

test('normal template still works', () => {
    const tokens = tokenize('`a${"b"}c`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "\`: ",
        "template: a",
        "\${: ",
        "string: b",
        "}: ",
        "template: c",
        "\`: ",
      ]
    `);
});

test('tokenize SIGIL as "SIGIL`"', () => {
    const tokens = tokenize('_`<a>...</a>`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@\`: ",
        "template: <a>...</a>",
        "\`: ",
      ]
    `);
});

test('"_`" is atomic token, "_" itself has no special meaning', () => {
    const tokens = tokenize('_ `hello`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "name: _",
        "\`: ",
        "template: hello",
        "\`: ",
      ]
    `);
});

test('SIGIL + block comment okay though...', () => {
    const tokens = tokenize('_/*html*/`hello`');
    expect(tokens).toMatchInlineSnapshot(`
    [
      "name: _",
      "\`: ",
      "template: hello",
      "\`: ",
    ]
  `);
});

test('tokenize "${text} #{dom} {smart}" as interpolators', () => {
    const tokens = tokenize('_`<div>${text} #{dom} {smart}</div>`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@\`: ",
        "template: <div>",
        "\${: ",
        "name: text",
        "}: ",
        "template:  ",
        "#{: ",
        "name: dom",
        "}: ",
        "template:  ",
        "{: ",
        "name: smart",
        "}: ",
        "template: </div>",
        "\`: ",
      ]
    `);
});

test('"{" can be escaped', () => {
    const tokens = tokenize('_`hello \\{name}!`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@\`: ",
        "template: hello {name}!",
        "\`: ",
      ]
    `);
});

test('"{" and "#{" not recognized outside of azoth templates', () => {
    const tokens = tokenize('`<div>${text} #{dom} {smart}</div>`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "\`: ",
        "template: <div>",
        "\${: ",
        "name: text",
        "}: ",
        "template:  #{dom} {smart}</div>",
        "\`: ",
      ]
    `);
});

test('invalid template still reads on invalid escape sequence', () => {
    
    const tokens = tokenize('_`a\\uone${1}a\\utwo#{2}a\\uthree{3}a\\ufour`');
  
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@\`: ",
        "invalidTemplate: a\\uone",
        "\${: ",
        "num: 1",
        "}: ",
        "invalidTemplate: a\\utwo",
        "#{: ",
        "num: 2",
        "}: ",
        "invalidTemplate: a\\uthree",
        "{: ",
        "num: 3",
        "}: ",
        "invalidTemplate: a\\ufour",
        "\`: ",
      ]
    `);
});

test('invalid template still reads on normal template', () => {
    
    const tokens = tokenize('`a\\uone${1}a\\utwo#{2}a\\uthree{3}a\\ufour`');
  
    expect(tokens).toMatchInlineSnapshot(`
      [
        "\`: ",
        "invalidTemplate: a\\uone",
        "\${: ",
        "num: 1",
        "}: ",
        "invalidTemplate: a\\utwo#{2}a\\uthree{3}a\\ufour",
        "\`: ",
      ]
    `);
});


