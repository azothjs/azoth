/* eslint-disable no-undef */
import { makeTargets, makeRenderer, makeBind } from './template-generators.js';
import { parse, generate as _generate } from '../compiler.js';
import { describe, test, beforeEach } from 'vitest';

function preParse(input, expect) {
    const ast = parse(input);
    const initial = _generate(ast);
    const template = initial.templates[0];
    expect(template.node.type).toBe('JSXElement');
    return template;
}

describe('targets generator', () => {

    beforeEach(context => {
        context.compile = code => {
            const template = preParse(code, context.expect);
            return makeTargets(template);
        };
    });

    test('simple', ({ compile, expect }) => {
        const code = compile(`name => <p>{name}</p>`);
        expect(code).toMatchInlineSnapshot(`"(r) => [r.childNodes[0]]"`);
    });

    test('props and elements', ({ compile, expect }) => {
        const code = compile(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`);
        expect(code).toMatchInlineSnapshot(
            `"(r,t) => [r,r.childNodes[1],t[0].childNodes[1]]"`
        );
    });
});

describe('bind generator', () => {

    beforeEach(context => {
        context.compile = code => {
            const template = preParse(code, context.expect);
            return makeBind(template);
        };
    });

    test('simple', ({ compile, expect }) => {
        const code = compile(`name => <p>{name}</p>`);
        expect(code).toMatchInlineSnapshot(`
          "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              compose(t0, v0);
            };    
          }"
        `);
    });

    test('props and elements', ({ compile, expect }) => {
        const code = compile(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`);
        expect(code).toMatchInlineSnapshot(
            `
          "(ts) => {
            const t0 = ts[0], t1 = ts[1], t2 = ts[2];
            return (v0, v1, v2) => {
              t0.className = v0;
              compose(t1, v1);
              compose(t2, v2);
            };    
          }"
        `
        );
    });
});

describe('renderDOM generator', () => {

    beforeEach(context => {
        context.compile = code => {
            const template = preParse(code, context.expect);
            return makeRenderer(template, { includeContent: true });
        };
    });

    test('simple', ({ compile, expect }) => {
        const code = compile(`name => <p>{name}</p>`);

        expect(code).toMatchInlineSnapshot(`"renderer("c193fcb516", g1a9d5db22c, bd41d8cd98f, false, "<p><!--0--></p>")"`);
    });

    test('static', ({ compile, expect }) => {
        const code = compile(`() => <p>static</p>`);

        expect(code).toMatchInlineSnapshot(`"renderer("e8a7ca1ef0", null, null, false, "<p>static</p>")"`);
    });


    test('props and elements', ({ compile, expect }) => {
        const code = compile(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`);

        expect(code).toMatchInlineSnapshot(
            `
          "renderer("b32dab1494", g98cb41d3ff, bb90a39b45c, false, "<p>
                      <!--0--> <span data-bind>hey <!--0-->!</span>
                  </p>")"
        `
        );
    });

    test('option { noContent: true }', ({ expect }) => {
        const template = preParse(`name => <p>{name}</p>`, expect);
        const code = makeRenderer(template, { noContent: true });

        expect(code).toMatchInlineSnapshot(`"renderer("c193fcb516", g1a9d5db22c, bd41d8cd98f, false)"`);
    });

    test('option inject { targets: code, bind: code }', ({ expect }) => {
        const template = preParse(`name => <p>{name}</p>`, expect);
        const code = makeRenderer(template, {
            targets: `"targets!"`,
            bind: `"bind!"`,
        });

        expect(code).toMatchInlineSnapshot(`"renderer("c193fcb516", g1a9d5db22c, bd41d8cd98f, false)"`);
    });



});

