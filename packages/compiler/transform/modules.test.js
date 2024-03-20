/* eslint-disable no-undef */
import { makeTargets, makeGetBound, makeRender } from './AssetsGenerator.js';
import { parse, generate as _generate } from '../compiler.js';
import { describe, test, beforeEach } from 'vitest';
import { RenderGenerator } from './RenderGenerator.js';

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
        expect(code).toMatchInlineSnapshot(`
          "const targets = (r) => [r.childNodes[0]];
          "
        `);
    });

    test('props and elements', ({ compile, expect }) => {
        const code = compile(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`);
        expect(code).toMatchInlineSnapshot(
            `
          "const targets = (r,t) => [r,r.childNodes[1],t[0].childNodes[1]];
          "
        `
        );
    });
});

describe('getBound generator', () => {

    beforeEach(context => {
        context.getTemplate = code => {
            return preParse(code, context.expect);
        };
    });

    test('simple', ({ expect }) => {
        const template = preParse(`name => <p>{name}</p>`, expect);
        const code = makeGetBound(template);

        expect(code).toMatchInlineSnapshot(`
          "const getBound = renderer('904ca237ee', targets, bind, false, <p><!--0--></p>);
          "
        `);
    });

    test('props and elements', ({ expect }) => {
        const template = preParse(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`, expect);
        const code = makeGetBound(template);
        expect(code).toMatchInlineSnapshot(
            `
          "const getBound = renderer('5252cfebed', targets, bind, false, <p>
                      <!--0--> <span data-bind>hey <!--0-->!</span>
                  </p>);
          "
        `
        );
    });

    test('option noContent: true', ({ getTemplate, expect }) => {
        const template = getTemplate(`name => <p>{name}</p>`);
        const code = makeGetBound(template, { noContent: true });

        expect(code).toMatchInlineSnapshot(`
          "const getBound = renderer('904ca237ee', targets, bind, false);
          "
        `);
    });



});

describe('bind generator', () => {

    beforeEach(context => {
        context.compile = code => {
            const template = preParse(code, context.expect);
            return RenderGenerator.generate(template).code;
        };
    });

    test('simple', ({ compile, expect }) => {
        const code = compile(`name => <p>{name}</p>`);
        expect(code).toMatchInlineSnapshot(`
          "function bind(ts) {
            const t0 = ts[0];
            return (v0) => {
              compose(t0, v0);
            };
          }
          "
        `);
    });

    test('props and elements', ({ compile, expect }) => {
        const code = compile(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`);
        expect(code).toMatchInlineSnapshot(
            `
          "function bind(ts) {
            const t0 = ts[0], t1 = ts[1], t2 = ts[2];
            return (v0, v1, v2) => {
              t0.className = v0;
              compose(t1, v1);
              compose(t2, v2);
            };
          }
          "
        `
        );
    });
});

describe('render generator', () => {

    beforeEach(context => {
        context.compile = code => {
            const template = preParse(code, context.expect);
            return makeRender(template);
        };
    });

    test('simple', ({ compile, expect }) => {
        const code = compile(`name => <p>{name}</p>`);
        expect(code).toMatchInlineSnapshot(`
          "function renderDOM(p0) {
            const [root, bind] = getBound();
            bind(p0);
            return root;
          }
          "
        `);
    });

    test('props and elements', ({ compile, expect }) => {
        const code = compile(`const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`);
        expect(code).toMatchInlineSnapshot(
            `
          "function renderDOM(p0,p1,p2) {
            const [root, bind] = getBound();
            bind(p0,p1,p2);
            return root;
          }
          "
        `
        );
    });
});