/* eslint-disable no-undef */
import { compile as _compile } from './index.js';
import { describe, test } from 'vitest';

const compile = input => {
    return _compile(input, {
        generator: { indent: '    ' }
    });
};

describe('JSX dom literals', () => {
    test('complex template structure with props and child nodes', ({ expect }) => {
        const input = `const t = <div>
            <p className={"my-class"}>{"felix"}</p>
            <p>static</p>
            <p>{"this is"}<span>{"azoth"}</span></p>
            <ul>
                <li><span>one</span></li>
                <li><span><em>a{"two"}b{"and..."}c</em></span></li>
                <li><span className={"span-class"}>three</span></li>
                {"ul-footer"}
            </ul>
            <img/>
            <custom-element/>
            <custom-element />
            {"footer"}
        </div>;`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const t = (() => {
              const [__root, __targets] = tfdd1a869cf();
              const __target0 = __targets[0];
              const __target1 = __targets[1];
              const __target2 = __targets[2];
              const __target3 = __targets[3];
              const __target4 = __targets[4];
              const __target5 = __targets[5];
              const __child1 = __target0.childNodes[0];
              const __child2 = __target1.childNodes[0];
              const __child3 = __target2.childNodes[0];
              const __child4 = __target4.childNodes[1];
              const __child5 = __target4.childNodes[3];
              const __child7 = __target3.childNodes[7];
              const __child8 = __root.childNodes[15];
              __target0.className = ("my-class");
              __compose("felix", __child1);
              __compose("this is", __child2);
              __compose("azoth", __child3);
              __compose("two", __child4);
              __compose("and...", __child5);
              __target5.className = ("span-class");
              __compose("ul-footer", __child7);
              __compose("footer", __child8);
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div>
                      <p data-bind><!--0--></p>
                      <p>static</p>
                      <p data-bind><!--0--><span data-bind><!--0--></span></p>
                      <ul data-bind>
                          <li><span>one</span></li>
                          <li><span><em data-bind>a<!--0-->b<!--0-->c</em></span></li>
                          <li><span data-bind>three</span></li>
                          <!--0-->
                      </ul>
                      <img>
                      <custom-element></custom-element>
                      <custom-element></custom-element>
                      <!--0-->
                  </div>",
              "id": "fdd1a869cf",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
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
              const __root = t10073da0ec()[0];
              __root.className = ("className");
              __root.name = ("name");
              __root["class"] = ("class");
              __root["class-name"] = ("class-name");
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<input required>",
              "id": "10073da0ec",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);
    });
});

describe('nested context', () => {
    test('static composed', ({ expect }) => {
        const input = `<div>{<hr/>}</div>`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "(() => {
              const __root = t8dae88052a()[0];
              const __child0 = __root.childNodes[0];
              __compose(t1a78cbe949()[0], __child0);
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div><!--0--></div>",
              "id": "8dae88052a",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);
    });
});

describe('template optimizations', () => {
    test('static (no binding targets)', ({ expect }) => {
        const input = `
            const template = <p>Hello</p>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const template = t5bf3d2f523()[0];
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<p>Hello</p>",
              "id": "5bf3d2f523",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);
    });
});

describe('surrounding code integration', () => {

    test('ArrowFunctionExpression: implicit return is block return', ({ expect }) => {
        const input = `
            const template = (text) => <p>{text}</p>
        `;

        expect(compile(input)).toMatchInlineSnapshot(`
          {
            "code": "const template = text => {
              const __root = t904ca237ee()[0];
              const __child0 = __root.childNodes[0];
              __compose(text, __child0);
              return __root;
          };
          ",
            "templates": [
              {
                "html": "<p><!--0--></p>",
                "id": "904ca237ee",
                "isDomFragment": false,
                "needs": {
                  "compose": true,
                  "composeElement": false,
                  "createElement": false,
                },
              },
            ],
          }
        `);
    });

    test('ReturnStatement: injects statements before, returns root', ({ expect }) => {
        const input = `
            function template(text) {
                const format = 'text' + '!';
                return <p>{text}</p>;
            }
        `;

        expect(compile(input)).toMatchInlineSnapshot(`
          {
            "code": "function template(text) {
              const format = 'text' + '!';
              const __root = t904ca237ee()[0];
              const __child0 = __root.childNodes[0];
              __compose(text, __child0);
              return __root;
          }
          ",
            "templates": [
              {
                "html": "<p><!--0--></p>",
                "id": "904ca237ee",
                "isDomFragment": false,
                "needs": {
                  "compose": true,
                  "composeElement": false,
                  "createElement": false,
                },
              },
            ],
          }
        `);
    });
});

describe('fragments', () => {
    test('<> ... </> basic', ({ expect }) => {
        const input = `
            const fragment = <><hr/><hr/></>;
            const single = <><hr/></>;
            const fragInFrag = <><><hr/></></>;
            const fragInFragCompose = <><>{x}</></>;
            const empty = <></>;
            const compose = <>{x}</>;
            const text = <>text</>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const fragment = tc203fe7dcd(true)[0];
          const single = t1a78cbe949()[0];
          const fragInFrag = t1a78cbe949()[0];
          const fragInFragCompose = (() => {
              const __root = tc084de4382(true)[0];
              const __child0 = __root.childNodes[0];
              __compose(x, __child0);
              return __root;
          })();
          const empty = null;
          const compose = (() => {
              const __root = tc084de4382(true)[0];
              const __child0 = __root.childNodes[0];
              __compose(x, __child0);
              return __root;
          })();
          const text = t1cb251ec0d(true)[0];
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<hr><hr>",
              "id": "c203fe7dcd",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "text",
              "id": "1cb251ec0d",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });

    test('<> ... </> trim as basic except text html', ({ expect }) => {
        const input = `
            const fragment = <>
                <hr/><hr/>
            </>;
            const single = <>
                <hr/>
            </>;
            const fragInFrag = <>
                <>
                    <hr/>
                </>
            </>;
            const fragInFragCompose = <>
                <>
                    {x}
                </>
            </>;
            const empty = <>
            </>;
            const compose = <>
                {x}
            </>;
            const text = <>
                text
            </>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const fragment = tc203fe7dcd(true)[0];
          const single = t1a78cbe949()[0];
          const fragInFrag = t1a78cbe949()[0];
          const fragInFragCompose = (() => {
              const __root = tc084de4382(true)[0];
              const __child0 = __root.childNodes[0];
              __compose(x, __child0);
              return __root;
          })();
          const empty = null;
          const compose = (() => {
              const __root = tc084de4382(true)[0];
              const __child0 = __root.childNodes[0];
              __compose(x, __child0);
              return __root;
          })();
          const text = t6c72de769d(true)[0];
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<hr><hr>",
              "id": "c203fe7dcd",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "
                          text
                      ",
              "id": "6c72de769d",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });

    test('<> ... </> partial trim', ({ expect }) => {
        const input = `
            const start = <>
                <hr/></>;
            const end = <><hr/>
            </>;
            const composeStart = <>
                {x}</>;
            const composeEnd = <>{x}
            </>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const start = t1a78cbe949()[0];
          const end = t1a78cbe949()[0];
          const composeStart = (() => {
              const __root = tc084de4382(true)[0];
              const __child0 = __root.childNodes[0];
              __compose(x, __child0);
              return __root;
          })();
          const composeEnd = (() => {
              const __root = tc084de4382(true)[0];
              const __child0 = __root.childNodes[0];
              __compose(x, __child0);
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });

    test('<> ... </> no trim', ({ expect }) => {
        const input = `
            const fragment = <> <hr/><hr/> </>;
            const single = <> <hr/> </>;
            const fragInFrag = <> <> <hr/> </> </>;
            const spaces = <>    </>;
            const compose = <> {x} </>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const fragment = t653a3aad80(true)[0];
          const single = tdcaa233028(true)[0];
          const fragInFrag = t2dc1738d5c(true)[0];
          const spaces = t0cf31b2c28(true)[0];
          const compose = (() => {
              const __root = t5bc2a159b1(true)[0];
              const __child0 = __root.childNodes[1];
              __compose(x, __child0);
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": " <hr><hr> ",
              "id": "653a3aad80",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": " <hr> ",
              "id": "dcaa233028",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "  <hr>  ",
              "id": "2dc1738d5c",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "    ",
              "id": "0cf31b2c28",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": " <!--0--> ",
              "id": "5bc2a159b1",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
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
              const __root = tfaf808e6cc(true)[0];
              const __child0 = __root.childNodes[1];
              __compose("two", __child0);
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "one<!--0-->three",
              "id": "faf808e6cc",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
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
          "const extraneous = tccaa44c114()[0];
          const childNodeIndex = (() => {
              const __root = t681310be49()[0];
              const __child0 = __root.childNodes[3];
              __compose("expect index 3", __child0);
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div><hr><hr><hr></div>",
              "id": "ccaa44c114",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<div>
                          <p></p>
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "681310be49",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });

    test('edge case: <>{...}<el>{...}</el></>', ({ expect }) => {
        const input = `const App = <>{'foo'}<main>{'bar'}</main>{'qux'}</>;`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const App = (() => {
              const [__root, __targets] = tef691fa27a(true);
              const __target0 = __targets[0];
              const __child0 = __root.childNodes[0];
              const __child1 = __target0.childNodes[0];
              const __child2 = __root.childNodes[2];
              __compose('foo', __child0);
              __compose('bar', __child1);
              __compose('qux', __child2);
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "ef691fa27a",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });
});

describe('template root', () => {
    test('single element is root', ({ expect }) => {
        const input = `
            const div = <div>{hello}</div>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const div = (() => {
              const __root = t8dae88052a()[0];
              const __child0 = __root.childNodes[0];
              __compose(hello, __child0);
              return __root;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div><!--0--></div>",
              "id": "8dae88052a",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });
});

describe('element composition', () => {

    test('custom-element with property', ({ expect }) => {
        const input = `
            const html = \`&nsbsp;<strong>Hello Raw</strong>\`;
            document.body.append(<raw-html html={html}/>);
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const html = \`&nsbsp;<strong>Hello Raw</strong>\`;
          document.body.append((() => {
              const __root = t4ca37f3876()[0];
              __root.html = (html);
              return __root;
          })());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<raw-html></raw-html>",
              "id": "4ca37f3876",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });

    test('top level components: empty and with props', ({ expect }) => {
        const input = `
            const c = <Component/>;
            const cProps = <Component prop={value} attr="static"/>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const c = __createElement(Component);
          const cProps = __createElement(Component, { prop: value, attr: "static", });
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
          ]
        `);
    });

    test('child level components: empty and with props', ({ expect }) => {
        const input = `
            const component = <div>
                <Component prop={value} prop2="literal"/>
                <GotNoPropsAsYouCanSee/>
            </div>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const component = (() => {
              const __root = t2288998344()[0];
              const __child0 = __root.childNodes[1];
              const __child1 = __root.childNodes[3];
              __composeElement(Component, __child0, { prop: value, prop2: "literal", });
              __composeElement(GotNoPropsAsYouCanSee, __child1);
              return __root;
          })();
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "2288998344",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": true,
                "createElement": false,
              },
            },
          ]
        `);
    });

    test('nested child anchors', ({ expect }) => {
        const input = `
            const $A = <A/>;
            const $B = <B/>;
            const dom = <div>
                {$A}
                {$B}
            </div>;

        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const $A = __createElement(A);
          const $B = __createElement(B);
          const dom = (() => {
              const __root = t2288998344()[0];
              const __child0 = __root.childNodes[1];
              const __child1 = __root.childNodes[3];
              __compose($A, __child0);
              __compose($B, __child1);
              return __root;
          })();
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "2288998344",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });

    test('return keyword in Function with static jsx', ({ expect }) => {
        const input = `
            function Surprise() {
                return <section>
                    <h2>Guess What...</h2>
                    <p>surprise!</p>
                </section>;
            }
        `;

        const { code } = compile(input);

        expect(compile(input)).toMatchInlineSnapshot(`
          {
            "code": "function Surprise() {
              return t92cc583556()[0];
          }
          ",
            "templates": [
              {
                "html": "<section>
                              <h2>Guess What...</h2>
                              <p>surprise!</p>
                          </section>",
                "id": "92cc583556",
                "isDomFragment": false,
                "needs": {
                  "compose": false,
                  "composeElement": false,
                  "createElement": false,
                },
              },
            ],
          }
        `);

    });

    test('component child templates', ({ expect }) => {
        const input = `
            const c = <Component><p>{"test"}</p></Component>;
            const cTrim = <Component>
                <p>{"test"}</p>
            </Component>;
            const cTrimStart = <Component>
                <p>{"test"}</p></Component>;
            const cTrimEnd = <Component><p>{"test"}</p>
            </Component>;
            const cText = <Component>text</Component>;
            const cFrag = <Component>
                <p>{1}</p>
                <p>{2}</p>
            </Component>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const c = __createElement(Component, null, (() => {
              const __root = t904ca237ee()[0];
              const __child0 = __root.childNodes[0];
              __compose("test", __child0);
              return __root;
          })());
          const cTrim = __createElement(Component, null, (() => {
              const __root = t904ca237ee()[0];
              const __child0 = __root.childNodes[0];
              __compose("test", __child0);
              return __root;
          })());
          const cTrimStart = __createElement(Component, null, (() => {
              const __root = t904ca237ee()[0];
              const __child0 = __root.childNodes[0];
              __compose("test", __child0);
              return __root;
          })());
          const cTrimEnd = __createElement(Component, null, (() => {
              const __root = t904ca237ee()[0];
              const __child0 = __root.childNodes[0];
              __compose("test", __child0);
              return __root;
          })());
          const cText = __createElement(Component, null, t1cb251ec0d(true)[0]);
          const cFrag = __createElement(Component, null, (() => {
              const [__root, __targets] = t9b045328fb(true);
              const __target0 = __targets[0];
              const __target1 = __targets[1];
              const __child0 = __target0.childNodes[0];
              const __child1 = __target1.childNodes[0];
              __compose(1, __child0);
              __compose(2, __child1);
              return __root;
          })());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "<p><!--0--></p>",
              "id": "904ca237ee",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "<p><!--0--></p>",
              "id": "904ca237ee",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "<p><!--0--></p>",
              "id": "904ca237ee",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "<p><!--0--></p>",
              "id": "904ca237ee",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "text",
              "id": "1cb251ec0d",
              "isDomFragment": true,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "needs": {
                "compose": false,
                "composeElement": false,
                "createElement": true,
              },
            },
            {
              "html": "<p data-bind><!--0--></p>
                          <p data-bind><!--0--></p>",
              "id": "9b045328fb",
              "isDomFragment": true,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);
    });

});

describe('render and composition cases', () => {

    test('map in block', ({ expect }) => {
        const input = `
            const Item = name => <li>{name}</li>;
            const Template = () => <div>{[2, 4, 7].map(Item)}{"text"}</div>
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const Item = name => {
              const __root = t62831a5152()[0];
              const __child0 = __root.childNodes[0];
              __compose(name, __child0);
              return __root;
          };
          const Template = () => {
              const __root = t8dc93cc914()[0];
              const __child0 = __root.childNodes[0];
              const __child1 = __root.childNodes[1];
              __compose([2, 4, 7].map(Item), __child0);
              __compose("text", __child1);
              return __root;
          };
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li><!--0--></li>",
              "id": "62831a5152",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<div><!--0--><!--0--></div>",
              "id": "8dc93cc914",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });

    test('edge case: previously broken esbuild jsx', ({ expect }) => {
        const input = `
            const render = () => <li className={category}>Hello {place}</li>
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const render = () => {
              const __root = t2b440f4741()[0];
              const __child1 = __root.childNodes[1];
              __root.className = (category);
              __compose(place, __child1);
              return __root;
          };
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li>Hello <!--0--></li>",
              "id": "2b440f4741",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);

    });

    test('list composition', ({ expect }) => {
        const input = `        
            const Emoji = ({ name }) => <li>{name}</li>;
            const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
            const Emojis = <ul>{promise}</ul>;
            document.body.append(Emojis);
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const Emoji = ({name}) => {
              const __root = t62831a5152()[0];
              const __child0 = __root.childNodes[0];
              __compose(name, __child0);
              return __root;
          };
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = (() => {
              const __root = t25ec157413()[0];
              const __child0 = __root.childNodes[0];
              __compose(promise, __child0);
              return __root;
          })();
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li><!--0--></li>",
              "id": "62831a5152",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
            {
              "html": "<ul><!--0--></ul>",
              "id": "25ec157413",
              "isDomFragment": false,
              "needs": {
                "compose": true,
                "composeElement": false,
                "createElement": false,
              },
            },
          ]
        `);


    });
});
