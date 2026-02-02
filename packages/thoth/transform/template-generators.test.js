/* eslint-disable no-undef */
import { makeTargets, makeRenderer, makeBind } from './template-generators.js';
import { parse, generate as _generate } from '../compiler.js';
import { describe, test, beforeEach } from 'vitest';

function preParse(input) {
    return preParseAll(input)[0];
}

function preParseAll(input) {
    const ast = parse(input);
    const initial = _generate(ast);
    return initial.templates;
}

describe('targets generator', () => {

    beforeEach(context => {
        context.compile = code => {
            const template = preParse(code);
            return makeTargets(template);
        };
        context.compileAll = code => {
            return preParseAll(code).map(makeTargets);
        };
    });

    test('composes', ({ compile, expect }) => {
        const code = compile(`name => <p>hello {name} <Display/></p>`);
        expect(code).toMatchInlineSnapshot(
            `"r => [r.childNodes[1],r.childNodes[3]]"`
        );
    });

    test('fragment composes', ({ compile, expect }) => {
        const code = compile(`name => <><p>hello</p><Display/></>`);
        expect(code).toMatchInlineSnapshot(`"r => [r.childNodes[1]]"`);
    });

    test('edge case', ({ compileAll, expect }) => {
        const code = compileAll(`
            export const Loading = () => <p>loading...</p>;
            export const Cat = ({ name }) => <p>{name}</p>;
            export const CatList = cats => <ul>{cats.map(Cat)}</ul>;
            export const CatCount = cats => <p>{cats.length} cats</p>;
            export const CatName = (name) => <li>{name}</li>;
            export const CatNames = cats => <ul>{cats.map(CatName)}</ul>;
        `);
        expect(code).toMatchInlineSnapshot(`
          [
            "null",
            "r => [r.childNodes[0]]",
            "r => [r.childNodes[0]]",
            "r => [r.childNodes[0]]",
            "r => [r.childNodes[0]]",
            "r => [r.childNodes[0]]",
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

    test('nested binding targets', ({ compile, expect }) => {
        const code = compile(`const t = <li>
            <h1>{priority}</h1>
            <p>{exit}</p>
        </li>;`);
        expect(code).toMatchInlineSnapshot(
            `"(r,t) => [t[0].childNodes[0],t[1].childNodes[0]]"`
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
              __c(t0, v0);
            };    
          }"
        `);
    });

    test('nested', ({ compile, expect }) => {
        const code = compile(`name => <ul><li>{name}</li></ul>`);
        expect(code).toMatchInlineSnapshot(`
          "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __c(t0, v0);
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
              __c(t1, v1);
              __c(t2, v2);
            };    
          }"
        `
        );
    });

    test('compose component', ({ compile, expect }) => {
        const code = compile(`<div>
            <Component prop={prop}><p>slottable</p></Component>
        </div>;`);
        expect(code).toMatchInlineSnapshot(
            `
          "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __cC(t0, v0);
            };    
          }"
        `
        );
    });

    test('data-/dataset props', ({ compile, expect }) => {
        const code = compile(`const t = <p data-id={id}></p>;`);
        expect(code).toMatchInlineSnapshot(
            `
          "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              t0.dataset.id = v0;
            };    
          }"
        `
        );
    });

    test('spread props', ({ compile, expect }) => {
        const code = compile(`const t = <p {...obj}></p>;`);
        expect(code).toMatchInlineSnapshot(
            `
          "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              Object.assign(t0, v0);
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
              __c(t0, v0);
            };    
          }",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __c(t0, v0);
            };    
          }",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __c(t0, v0);
            };    
          }",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __c(t0, v0);
            };    
          }",
            "(ts) => {
            const t0 = ts[0];
            return (v0) => {
              __c(t0, v0);
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

        expect(code).toMatchInlineSnapshot(`"__renderer("15aa2705", gdb407f11, b6b86b273, false, \`<p><!--0--></p>\`)"`);
    });

    test('static', ({ compile, expect }) => {
        const code = compile(`() => <p>static</p>`);

        expect(code).toMatchInlineSnapshot(`"__renderer("a84dfd44", null, null, false, \`<p>static</p>\`)"`);
    });

    test('jsx comments are ignored', ({ compile, expect }) => {
        // JSX comments {/* ... */} should not generate anchor placeholders
        const code = compile(`({ title }) => <div>
            {/* Title is optional */}
            {title && <h1>{title}</h1>}
        </div>`);

        // Only one <!--0--> for the conditional, none for the comment
        expect(code).toMatchInlineSnapshot(`"__renderer("77ff2813", g24227028, b6b86b273, false, \`<div>
            
            <!--0-->
        </div>\`)"`);
    });


    test('props and elements', ({ compile, expect }) => {
        const code = compile(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`);

        expect(code).toMatchInlineSnapshot(
            `
          "__renderer("2ce4ea27", gedc11336, b8477292e, false, \`<p>
                      <!--0--> <span data-bind>hey <!--0-->!</span>
                  </p>\`)"
        `
        );
    });

    test('option { noContent: true }', ({ expect }) => {
        const template = preParse(`name => <p>{name}</p>`, expect);
        const code = makeRenderer(template, { noContent: true });

        expect(code).toMatchInlineSnapshot(`"__renderer("15aa2705", gdb407f11, b6b86b273, false)"`);
    });


    test('edge case', ({ expect }) => {
        const input = `
            export const Loading = () => <p>loading...</p>;
            export const Cat = ({ name }) => <p>{name}</p>;
            export const CatList = cats => <ul>{cats.map(Cat)}</ul>;
            export const CatCount = cats => <p>{cats.length} cats</p>;
            export const CatName = (name) => <li>{name}</li>;
            export const CatNames = cats => <ul>{cats.map(CatName)}</ul>;
        `;

        const ast = parse(input);
        const initial = _generate(ast);
        const mapped = initial.templates.map(makeRenderer);
        expect(mapped).toMatchInlineSnapshot(`
          [
            "__renderer("191b5e03", null, null, false, \`<p>loading...</p>\`)",
            "__renderer("15aa2705", gdb407f11, b6b86b273, false, \`<p><!--0--></p>\`)",
            "__renderer("3fcf8b87", gdb407f11, b6b86b273, false, \`<ul><!--0--></ul>\`)",
            "__renderer("2c4a6c0f", gdb407f11, b6b86b273, false, \`<p><!--0--> cats</p>\`)",
            "__renderer("fbb7e8b4", gdb407f11, b6b86b273, false, \`<li><!--0--></li>\`)",
            "__renderer("3fcf8b87", gdb407f11, b6b86b273, false, \`<ul><!--0--></ul>\`)",
          ]
        `);
    });

});