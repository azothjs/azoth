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

    test('edge case', ({ expect }) => {
        const input = `
            export const Loading = () => <p>loading...</p>;
            export const Cat = ({ name }) => <p>{name}</p>;
            export const CatList = cats => <ul>{cats.map(Cat)}</ul>;
            export const CatCount = cats => <p>{cats.length} cats</p>;
            export const CatName = ({ name }) => <li>{name}</li>;
            export const CatNames = cats => <ul>{cats.map(name => <CatName name={name} />)}</ul>;
        `;

        const ast = parse(input);
        const initial = _generate(ast);
        const mapped = initial.templates.map(makeTargets);
        expect(mapped).toMatchInlineSnapshot(`
          [
            "null",
            "(r) => [r.childNodes[0]]",
            "(r) => [r.childNodes[0]]",
            "(r) => [r.childNodes[0]]",
            "(r) => [r.childNodes[0]]",
            "(r) => [r.childNodes[0]]",
            "null",
          ]
        `);
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
              __compose(t0, v0);
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
              __compose(t1, v1);
              __compose(t2, v2);
            };    
          }"
        `
        );
    });


    test('edge case', ({ expect }) => {
        const input = `
            export const Loading = () => <p>loading...</p>;
            export const Cat = ({ name }) => <p>{name}</p>;
            export const CatList = cats => <ul>{cats.map(Cat)}</ul>;
            export const CatCount = cats => <p>{cats.length} cats</p>;
            export const CatName = ({ name }) => <li>{name}</li>;
            export const CatNames = cats => <ul>{cats.map(name => <CatName name={name} />)}</ul>;
        `;

        const ast = parse(input);
        const initial = _generate(ast);
        const mapped = initial.templates.map(makeBind);
        expect(mapped).toMatchInlineSnapshot(`
          [
            "null",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }",
            "null",
          ]
        `);
    });
});

describe('render generator', () => {

    beforeEach(context => {
        context.compile = code => {
            const template = preParse(code, context.expect);
            return makeRenderer(template, { includeContent: true });
        };
    });

    test('simple', ({ compile, expect }) => {
        const code = compile(`name => <p>{name}</p>`);

        expect(code).toMatchInlineSnapshot(`"__renderer("c193fcb516", g1a9d5db22c, bd41d8cd98f, false, \`<p><!--0--></p>\`)"`);
    });

    test('static', ({ compile, expect }) => {
        const code = compile(`() => <p>static</p>`);

        expect(code).toMatchInlineSnapshot(`"__renderer("e8a7ca1ef0", null, null, false, \`<p>static</p>\`)"`);
    });


    test('props and elements', ({ compile, expect }) => {
        const code = compile(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`);

        expect(code).toMatchInlineSnapshot(
            `
          "__renderer("b32dab1494", g98cb41d3ff, bb90a39b45c, false, \`<p>
                      <!--0--> <span data-bind>hey <!--0-->!</span>
                  </p>\`)"
        `
        );
    });

    test('option { noContent: true }', ({ expect }) => {
        const template = preParse(`name => <p>{name}</p>`, expect);
        const code = makeRenderer(template, { noContent: true });

        expect(code).toMatchInlineSnapshot(`"__renderer("c193fcb516", g1a9d5db22c, bd41d8cd98f, false)"`);
    });


    test('edge case', ({ expect }) => {
        const input = `
            export const Loading = () => <p>loading...</p>;
            export const Cat = ({ name }) => <p>{name}</p>;
            export const CatList = cats => <ul>{cats.map(Cat)}</ul>;
            export const CatCount = cats => <p>{cats.length} cats</p>;
            export const CatName = ({ name }) => <li>{name}</li>;
            export const CatNames = cats => <ul>{cats.map(name => <CatName name={name} />)}</ul>;
        `;

        const ast = parse(input);
        const initial = _generate(ast);
        const mapped = initial.templates.map(makeRenderer);
        expect(mapped).toMatchInlineSnapshot(`
          [
            "__renderer("35b2653e5d", null, null, false, \`<p>loading...</p>\`)",
            "__renderer("c193fcb516", g1a9d5db22c, bd41d8cd98f, false, \`<p><!--0--></p>\`)",
            "__renderer("65cf075bba", g1a9d5db22c, bd41d8cd98f, false, \`<ul><!--0--></ul>\`)",
            "__renderer("b4f8dfe3c0", g1a9d5db22c, bd41d8cd98f, false, \`<p><!--0--> cats</p>\`)",
            "__renderer("cb5355f810", g1a9d5db22c, bd41d8cd98f, false, \`<li><!--0--></li>\`)",
            "__renderer("65cf075bba", g1a9d5db22c, bd41d8cd98f, false, \`<ul><!--0--></ul>\`)",
            "__renderer("d41d8cd98f", null, null, false, \`\`)",
          ]
        `);
    });

});