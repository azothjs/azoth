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

describe('JSX dom literals', () => {
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
              const { node: t090c4b5012, targets: __targets } = __rendererById('090c4b5012');
              const __target0 = __targets[0];
              const __target1 = __targets[1];
              const __target2 = __targets[2];
              const __target3 = __targets[3];
              const __target4 = __targets[4];
              const __target5 = __targets[5];
              const __target6 = __targets[6];
              const __child1 = __target1.childNodes[0];
              const __child2 = __target2.childNodes[0];
              const __child3 = __target3.childNodes[0];
              const __child4 = __target5.childNodes[1];
              const __child5 = __target5.childNodes[3];
              const __child7 = __target4.childNodes[7];
              const __child8 = __target0.childNodes[13];
              __target1.className = ("my-class");
              __compose("felix", __child1);
              __compose("this is", __child2);
              __compose("azoth", __child3);
              __compose("two", __child4);
              __compose("and...", __child5);
              __target6.className = ("span-class");
              __compose("ul-footer", __child7);
              __compose("footer", __child8);
              return t090c4b5012;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div data-bind>
                      <p data-bind><!--0--></p>
                      <p>static</p>
                      <p data-bind><!--0--><span data-bind><!--0--></span></p>
                      <ul data-bind>
                          <li><span>one</span></li>
                          <li><span><em data-bind>a<!--0-->b<!--0-->c</em></span></li>
                          <li><span data-bind>three</span></li>
                          <!--0-->
                      </ul>
                      <self-closing />
                      <self-closing />
                      <!--0-->
                  </div>",
              "id": "090c4b5012",
            },
          ]
        `);
    });

    test('property names', ({ expect }) => {
        const input = `const t = <input 
            required
            className={"className"}
            name={"name"}
            class={"class"}
            class-name={"class-name"}
        />;`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const t = (() => {
              const { node: t24a912889d, targets: __targets } = __rendererById('24a912889d');
              const __target0 = __targets[0];
              __target0.className = ("className");
              __target0.name = ("name");
              __target0["class"] = ("class");
              __target0["class-name"] = ("class-name");
              return t24a912889d;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<input required data-bind />",
              "id": "24a912889d",
            },
          ]
        `);
    });
});

describe('surrounding code integration', () => {
    test('wrap in IIFE (default)', ({ expect }) => {
        const input = `
            const template = <p>{text}</p>;
        `;

        expect(compile(input).code).toMatchInlineSnapshot(`
          "const template = (() => {
              const { node: t666c3103ad, targets: __targets } = __rendererById('666c3103ad');
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(text, __child0);
              return t666c3103ad;
          })();
          "
        `);
    });

    test('ArrowFunctionExpression: implicit return is block return', ({ expect }) => {
        const input = `
            const template = (text) => <p>{text}</p>
        `;

        expect(compile(input).code).toMatchInlineSnapshot(`
          "const template = text => {
              const { node: t666c3103ad, targets: __targets } = __rendererById('666c3103ad');
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(text, __child0);
              return t666c3103ad;
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

        expect(compile(input).code).toMatchInlineSnapshot(`
          "function template(text) {
              const format = 'text' + '!';
              const { node: t666c3103ad, targets: __targets } = __rendererById('666c3103ad');
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(text, __child0);
              return t666c3103ad;
          }
          "
        `);
    });
});

describe('fragments', () => {
    test('<> ... </> works', ({ expect }) => {
        const input = `
            const fragment = <><hr/><hr/></>;
            const empty = <></>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const fragment = (() => {
              const { node: t7c9daff739, targets: __targets } = __rendererById('7c9daff739', { fragment: true });
              return t7c9daff739;
          })();
          const empty = (() => {
              const { node: td41d8cd98f, targets: __targets } = __rendererById('d41d8cd98f');
              return td41d8cd98f;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
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
        const input = `
            const fragment = <>one{"two"}three</>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const fragment = (() => {
              const { node: tfaf808e6cc, targets: __targets } = __rendererById('faf808e6cc', { fragment: true });
              const __child0 = tfaf808e6cc.childNodes[1];
              __compose("two", __child0);
              return tfaf808e6cc;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "one<!--0-->three",
              "id": "faf808e6cc",
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
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const extraneous = (() => {
              const { node: t0f05699ae4, targets: __targets } = __rendererById('0f05699ae4');
              return t0f05699ae4;
          })();
          const childNodeIndex = (() => {
              const { node: t09771bea6d, targets: __targets } = __rendererById('09771bea6d');
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[3];
              __compose("expect index 3", __child0);
              return t09771bea6d;
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
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "09771bea6d",
            },
          ]
        `);

    });
});

describe('child node composition changes', () => {

    test('map in block', ({ expect }) => {
        const input = `
            const $item = name => <li>{name}</li>;
            const $template = () => <div>{[2, 4, 7].map($item)}{"text"}</div>
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const $item = name => {
              const { node: tf00e886942, targets: __targets } = __rendererById('f00e886942');
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(name, __child0);
              return tf00e886942;
          };
          const $template = () => {
              const { node: t3bee4f3a47, targets: __targets } = __rendererById('3bee4f3a47');
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              const __child1 = __target0.childNodes[1];
              __compose([2, 4, 7].map($item), __child0);
              __compose("text", __child1);
              return t3bee4f3a47;
          };
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li data-bind><!--0--></li>",
              "id": "f00e886942",
            },
            {
              "html": "<div data-bind><!--0--><!--0--></div>",
              "id": "3bee4f3a47",
            },
          ]
        `);

    });

    test('edge case: odd childnodes in li', ({ expect }) => {
        const input = `const render = () => <li>Hello {'world'}?</li>`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const render = () => {
              const { node: t98bfbbc66f, targets: __targets } = __rendererById('98bfbbc66f');
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[1];
              __compose('world', __child0);
              return t98bfbbc66f;
          };
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li data-bind>Hello <!--0-->?</li>",
              "id": "98bfbbc66f",
            },
          ]
        `);

    });
});