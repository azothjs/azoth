/* eslint-disable no-useless-escape */
import { beforeEach, test } from 'vitest';
import { tokenize } from '.';

const options = { ecmaVersion: 'latest' };
const getTokens = code => [...tokenize(code, options)].map(
    t => `${t.type.label}: ${t.value ?? ''}`
);

beforeEach(context => {
    context.tokenize = code => context.expect(getTokens(code));
});

test('normal template literal', ({ tokenize }) => {
    tokenize('`a${"b"}c`').toMatchInlineSnapshot(`
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

test('#` is single token', ({ tokenize }) => {
    tokenize('#`<a>...</a>`').toMatchInlineSnapshot(`
      [
        "#\`: ",
        "template: <a>...</a>",
        "\`: ",
      ]
    `);
});

test('throws SyntaxError: "#" expects "`" as next char', ({ expect }) => {
    expect(() => getTokens('# `hello`')).toThrowErrorMatchingInlineSnapshot(
        `[SyntaxError: Expected "\`" after "#" but found character " " (1:1)]`
    );
});

test('# + block comment + ` okay though, cuz IDE...', ({ tokenize }) => {
    tokenize('#/*html*/`hello`').toMatchInlineSnapshot(`
      [
        "#\`: ",
        "template: hello",
        "\`: ",
      ]
    `);
});

test('tokenize "${text} #{dom} {smart}" as interpolators', ({ tokenize }) => {
    tokenize('#`<div>${text} #{dom} {smart}</div>`').toMatchInlineSnapshot(`
      [
        "#\`: ",
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

test('"{" can be escaped', ({ tokenize }) => {
    tokenize('#`hello \\{name}!`').toMatchInlineSnapshot(`
      [
        "#\`: ",
        "template: hello {name}!",
        "\`: ",
      ]
    `);
});

test('"{" and "#{" not recognized outside of azoth templates', ({ tokenize }) => {
    tokenize('`<div>${text} #{dom} {smart}</div>`').toMatchInlineSnapshot(`
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

test('invalid template still reads on invalid escape sequence', ({ tokenize }) => {
    tokenize('#`a\\uone${1}a\\utwo#{2}a\\uthree{3}a\\ufour`')
        .toMatchInlineSnapshot(`
      [
        "#\`: ",
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

test('invalid template still reads on normal template', ({ tokenize }) => {
    tokenize('`a\\uone${1}a\\utwo#{2}a\\uthree{3}a\\ufour`')
        .toMatchInlineSnapshot(`
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
