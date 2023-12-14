/* eslint-disable no-useless-escape */
import { Parser } from 'acorn';
import { test, expect } from 'vitest';
import az from './acorn-jsz.js';

const JsxParser = Parser.extend(az());
const getTokens = code => [...JsxParser.tokenizer(code, { 
    ecmaVersion: 11, 
})].map(t => `${t.type.label}: ${t.value ?? ''}`);


test('tokenize "@" as decorator', () => {
    const tokens = getTokens('const t = @`<a>...</a>`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "const: const",
        "name: t",
        "=: =",
        "@: ",
        "\`: ",
        "template: <a>...</a>",
        "\`: ",
      ]
    `);
});

test('"@" must be followed by backtick', () => {
    expect(() => {
        getTokens('const t = @name`hello world`');
    }).toThrowErrorMatchingInlineSnapshot(
        `[SyntaxError: Unexpected character 'n', expected '\`' (1:11)]`
    );
});

test('tokenize "${" as interpolator (existing behavior)', () => {
    const tokens = getTokens('@`hello ${name}`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@: ",
        "\`: ",
        "template: hello ",
        "\${: ",
        "name: name",
        "}: ",
        "template: ",
        "\`: ",
      ]
    `);
});

test('tokenize "#{" as hash interpolator', () => {
    const tokens = getTokens('@`#{list}yo`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@: ",
        "\`: ",
        "template: ",
        "#{: ",
        "name: list",
        "}: ",
        "template: yo",
        "\`: ",
      ]
    `);
});

test('tokenize "{" as naked interpolator', () => {
    const tokens = getTokens('@`hello {name}!`');
    expect(tokens).toMatchInlineSnapshot(`
      [
        "@: ",
        "\`: ",
        "template: hello ",
        "{: ",
        "name: name",
        "}: ",
        "template: !",
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
        "template: hello \{name}!",
        "\`: ",
      ]
    `);
});
