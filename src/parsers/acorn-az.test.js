/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
import { test, expect } from 'vitest';
import acornAz from './acorn-az.js';

const JsxParser = Parser.extend(acornAz());
const getTokens = code => [
    ...JsxParser.tokenizer(code, { 
        ecmaVersion: 'latest', 
    })
].map(t => `${t.type.label}: ${t.value ?? ''}`);

test('tokenize "@" as decorator', () => {
    const tokens = getTokens('@`<a>...</a>`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@: ",
        "\`: ",
        "template: <a>...</a>",
        "\`: ",
      ]
    `);
});

test('"@" must be followed by backtick', () => {
    expect(() => {
        getTokens('const t = @bad`hello world`');
    }).toThrowErrorMatchingInlineSnapshot(
        `[SyntaxError: Unexpected character 'b', expected '\`' (1:11)]`
    );
});

test('tokenize "${text} #{dom} {smart}" as interpolators', () => {
    const tokens = getTokens('@`<div>${text} #{dom} {smart}</div>`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@: ",
        "\`: ",
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
    const tokens = getTokens('@`hello \\{name}!`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@: ",
        "\`: ",
        "template: hello {name}!",
        "\`: ",
      ]
    `);
});
