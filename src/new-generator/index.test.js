/* eslint-disable no-undef */
import { Parser } from 'acorn';
import acornJsx from 'acorn-jsx';
import { generate } from './index.js';
import { describe, test } from 'vitest';

const JsxParser = Parser.extend(acornJsx());
const parse = code => {
    return JsxParser.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module'
    });
};
const transpile = ast => generate(ast, { indent: '    ' });
const compile = input => {
    return transpile(parse(input));
};

describe('JSX Dom Literals', () => {
    test('complex template structure with props and child nodes', ({ expect }) => {
        const input = `const t = (<div>
            <p className={"my-class"}>{"felix"}</p>
            <p>static</p>
            <p>{"this is"}<span>{"azoth"}</span></p>
            <ul>
                <li><span>one</span></li>
                <li><span><em>a{"two"}b{"and..."}c</em></span></li>
                <li><span className={"span-class"}>three</span></li>
                {"ul-footer"}
            </ul>
            <self-closing/>
            <self-closing />
            {"footer"}
        </div>);`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const t = (() => {
              const { __root: td8d151bb16, __targets } = __renderById('d8d151bb16');
              const __target0 = __targets[0];
              const __target1 = __targets[1];
              const __target2 = __targets[2];
              const __target3 = __targets[3];
              const __target4 = __targets[4];
              const __target5 = __targets[5];
              const __target6 = __targets[6];
              __target1.className = "my-class";
              __target1.childNodes[0].data = "felix";
              __target2.childNodes[0].data = "this is";
              __target3.childNodes[0].data = "azoth";
              __target5.childNodes[1].data = "two";
              __target5.childNodes[3].data = "and...";
              __target6.className = "span-class";
              __target4.childNodes[7].data = "ul-footer";
              __target0.childNodes[13].data = "footer";
              return td8d151bb16;
          })();
          "
        `);


        expect(templates.map(t => t.html)).toMatchInlineSnapshot(`
          [
            "<div data-bind>
                      <p data-bind><text-node></text-node></p>
                      <p>static</p>
                      <p data-bind><text-node></text-node><span data-bind><text-node></text-node></span></p>
                      <ul data-bind>
                          <li><span>one</span></li>
                          <li><span><em data-bind>a<text-node></text-node>b<text-node></text-node>c</em></span></li>
                          <li><span data-bind>three</span></li>
                          <text-node></text-node>
                      </ul>
                      <self-closing />
                      <self-closing />
                      <text-node></text-node>
                  </div>",
          ]
        `);
    });
});

describe('surrounding code integration', () => {
    test('wrap in IIFE (default)', ({ expect }) => {
        const input = `
            const template = <p>{text}</p>;
        `;
        const ast = parse(input);
        const { code } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "const template = (() => {
              const { __root: t5f1933b83a, __targets } = __renderById('5f1933b83a');
              const __target0 = __targets[0];
              __target0.childNodes[0].data = text;
              return t5f1933b83a;
          })();
          "
        `);
    });

    test('ArrowFunctionExpression: implicit return is block return', ({ expect }) => {
        const input = `
            const template = (text) => <p>{text}</p>
        `;

        const ast = parse(input);
        const { code } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "const template = text => {
              const { __root: t5f1933b83a, __targets } = __renderById('5f1933b83a');
              const __target0 = __targets[0];
              __target0.childNodes[0].data = text;
              return t5f1933b83a;
          };
          "
        `);
    });


    test('ReturnStatement: injects statements before, returns root', ({ expect }) => {
        const input = `
            function template(text) {
                const format = 'text' + '!';
                return <p>{text}</p>;
            }
        `;
        const ast = parse(input);
        const { code } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "function template(text) {
              const format = 'text' + '!';
              const { __root: t5f1933b83a, __targets } = __renderById('5f1933b83a');
              const __target0 = __targets[0];
              __target0.childNodes[0].data = text;
              return t5f1933b83a;
          }
          "
        `);
    });
});


describe('Fragments', () => {
    test('<> ... </> works', ({ expect }) => {
        const input = `
            const fragment = <><hr/><hr/></>;
            const empty = <></>;
        `;
        const ast = parse(input);
        const { code, templates } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "const fragment = (() => {
              const { __root: t7c9daff739, __targets } = __renderById('7c9daff739', { fragment: true });
              return t7c9daff739;
          })();
          const empty = (() => {
              const { __root: td41d8cd98f, __targets } = __renderById('d41d8cd98f');
              return td41d8cd98f;
          })();
          "
        `);

        expect(templates.map(({ id, html }) => ({ id, html }))).toMatchInlineSnapshot(`
          [
            {
              "html": "<hr /><hr />",
              "id": "7c9daff739",
            },
            {
              "html": "",
              "id": "d41d8cd98f",
            },
          ]
        `);

    });

    test('text in fragment', ({ expect }) => {
        const input = `const fragment = <>one{"two"}three</>;`;
        const ast = parse(input);
        const { code, templates } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "const fragment = (() => {
              const { __root: tda6de0389d, __targets } = __renderById('da6de0389d', { fragment: true });
              tda6de0389d.childNodes[1].data = "two";
              return tda6de0389d;
          })();
          "
        `);

        expect(templates.map(({ id, html }) => ({ id, html }))).toMatchInlineSnapshot(`
          [
            {
              "html": "one<text-node></text-node>three",
              "id": "da6de0389d",
            },
          ]
        `);

    });

    test('extraneous removed with correct child node indexes', ({ expect }) => {
        const input = `
            const extraneous = <div><><hr/><hr/></><hr/></div>;
            
            const childNodeIndex = <div>
                <p></p>
                <>{"expect index 3"}<p></p></>
                <p></p>
            </div>;
        `;
        const ast = parse(input);
        const { code, templates } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "const extraneous = (() => {
              const { __root: t0f05699ae4, __targets } = __renderById('0f05699ae4');
              return t0f05699ae4;
          })();
          const childNodeIndex = (() => {
              const { __root: tc0259af968, __targets } = __renderById('c0259af968');
              const __target0 = __targets[0];
              __target0.childNodes[3].data = "expect index 3";
              return tc0259af968;
          })();
          "
        `);

        expect(templates.map(({ id, html }) => ({ id, html }))).toMatchInlineSnapshot(`
          [
            {
              "html": "<div><hr /><hr /><hr /></div>",
              "id": "0f05699ae4",
            },
            {
              "html": "<div data-bind>
                          <p></p>
                          <text-node></text-node><p></p>
                          <p></p>
                      </div>",
              "id": "c0259af968",
            },
          ]
        `);

    });
});