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
            <self-closing/>
            <self-closing />
            {"footer"}
        </div>;`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const t = (() => {
              const { root: __root_090c4b5012, targets: __targets } = t090c4b5012();
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
              return __root_090c4b5012;
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
              "isDomFragment": false,
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
              const { root: __root_24a912889d, targets: __targets } = t24a912889d();
              const __target0 = __targets[0];
              __target0.className = ("className");
              __target0.name = ("name");
              __target0["class"] = ("class");
              __target0["class-name"] = ("class-name");
              return __root_24a912889d;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<input required data-bind />",
              "id": "24a912889d",
              "isDomFragment": false,
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
              const { root: __root_969db86e55, targets: __targets } = t969db86e55();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(tb19eb87e75().root, __child0);
              return __root_969db86e55;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div data-bind><!--0--></div>",
              "id": "969db86e55",
              "isDomFragment": false,
            },
            {
              "html": "<hr />",
              "id": "b19eb87e75",
              "isDomFragment": false,
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
          "const template = t5bf3d2f523().root;
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<p>Hello</p>",
              "id": "5bf3d2f523",
              "isDomFragment": false,
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

        expect(compile(input).code).toMatchInlineSnapshot(`
          "const template = text => {
              const { root: __root_666c3103ad, targets: __targets } = t666c3103ad();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(text, __child0);
              return __root_666c3103ad;
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
              const { root: __root_666c3103ad, targets: __targets } = t666c3103ad();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(text, __child0);
              return __root_666c3103ad;
          }
          "
        `);
    });
});

describe('fragments', () => {
    test('<> ... </> works', ({ expect }) => {
        // const fragment = <><hr/><hr/></>;
        const input = `
            const empty = <></>;
        `;
        const { code, templates } = compile(input);

        //   "const fragment = t7c9daff739(true).root;
        expect(code).toMatchInlineSnapshot(`
          "const empty = null;
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": true,
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
          "const fragment = tfaf808e6cc(true).root;
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "one<!--0-->three",
              "id": "faf808e6cc",
              "isDomFragment": true,
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
          "const extraneous = t0f05699ae4().root;
          const childNodeIndex = (() => {
              const { root: __root_09771bea6d, targets: __targets } = t09771bea6d();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[3];
              __compose("expect index 3", __child0);
              return __root_09771bea6d;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div><hr /><hr /><hr /></div>",
              "id": "0f05699ae4",
              "isDomFragment": false,
            },
            {
              "html": "<div data-bind>
                          <p></p>
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "09771bea6d",
              "isDomFragment": false,
            },
          ]
        `);

    });

    test('edge case: <>{...}<el>{...}</el></>', ({ expect }) => {
        const input = `const App = <>{'foo'}<main>{'bar'}</main>{'qux'}</>;`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const App = (() => {
              const { root: __root_ef691fa27a, targets: __targets } = tef691fa27a(true);
              const __target0 = __targets[0];
              const __child0 = __root_ef691fa27a.childNodes[0];
              const __child1 = __target0.childNodes[0];
              const __child2 = __root_ef691fa27a.childNodes[2];
              __compose('foo', __child0);
              __compose('bar', __child1);
              __compose('qux', __child2);
              return __root_ef691fa27a;
          })();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "ef691fa27a",
              "isDomFragment": true,
            },
          ]
        `);

    });
});

describe('custom elements', () => {

    test('property on custom element', ({ expect }) => {
        const input = `
            const html = \`&nsbsp;<strong>Hello Raw</strong>\`;
            document.body.append(<raw-html html={html}/>);
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const html = \`&nsbsp;<strong>Hello Raw</strong>\`;
          document.body.append((() => {
              const { root: __root_c120befcf8, targets: __targets } = tc120befcf8();
              const __target0 = __targets[0];
              __target0.html = (html);
              return __root_c120befcf8;
          })());
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<raw-html data-bind />",
              "id": "c120befcf8",
              "isDomFragment": false,
            },
          ]
        `);

    });

    test('property on custom element', ({ expect }) => {
        const input = `
            const component = <div><Component prop={value}/></div>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const component = (() => {
              const { root: __root_2797af8021, targets: __targets } = t2797af8021();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __composeElement(Component, __child0, { prop: value, });
              return __root_2797af8021;
          })();
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div data-bind><Component /></div>",
              "id": "2797af8021",
              "isDomFragment": false,
            },
          ]
        `);
    });

    test.todo(`
        return <li><span is="raw-html" html={htmlCode} /> {unicode} {name}</li>;
    `, () => {

    });

    test.todo(`
        return <li>
            <RawHtml html={htmlCode.join('')}/> 
            {name}
            {unicode} 
        </li>;
    `);
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
              const { root: __root_f00e886942, targets: __targets } = tf00e886942();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(name, __child0);
              return __root_f00e886942;
          };
          const Template = () => {
              const { root: __root_3bee4f3a47, targets: __targets } = t3bee4f3a47();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              const __child1 = __target0.childNodes[1];
              __compose([2, 4, 7].map(Item), __child0);
              __compose("text", __child1);
              return __root_3bee4f3a47;
          };
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li data-bind><!--0--></li>",
              "id": "f00e886942",
              "isDomFragment": false,
            },
            {
              "html": "<div data-bind><!--0--><!--0--></div>",
              "id": "3bee4f3a47",
              "isDomFragment": false,
            },
          ]
        `);

    });

    test('edge case: broken esbuild jsx', ({ expect }) => {
        const input = `
            const render = () => <li className={category}>Hello {place}</li>
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "const render = () => {
              const { root: __root_e19fd83eae, targets: __targets } = te19fd83eae();
              const __target0 = __targets[0];
              const __child1 = __target0.childNodes[1];
              __target0.className = (category);
              __compose(place, __child1);
              return __root_e19fd83eae;
          };
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li data-bind>Hello <!--0--></li>",
              "id": "e19fd83eae",
              "isDomFragment": false,
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
              const { root: __root_f00e886942, targets: __targets } = tf00e886942();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(name, __child0);
              return __root_f00e886942;
          };
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = (() => {
              const { root: __root_df87cbf024, targets: __targets } = tdf87cbf024();
              const __target0 = __targets[0];
              const __child0 = __target0.childNodes[0];
              __compose(promise, __child0);
              return __root_df87cbf024;
          })();
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li data-bind><!--0--></li>",
              "id": "f00e886942",
              "isDomFragment": false,
            },
            {
              "html": "<ul data-bind><!--0--></ul>",
              "id": "df87cbf024",
              "isDomFragment": false,
            },
          ]
        `);


    });
});
