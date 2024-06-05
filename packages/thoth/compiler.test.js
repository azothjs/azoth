/* eslint-disable no-undef */
import { compile as _compile } from './compiler.js';
import { describe, test } from 'vitest';

const compile = input => {
    const { code, templates, map } = _compile(input, {
        generate: { indent: '    ' }
    });
    return {
        code, map,
        templates: templates.map(({ id, targetKey, bindKey, html, isDomFragment, isEmpty, tMap, bMap, propertyNames }) => {
            return {
                id, html, isDomFragment, isEmpty, targetKey, bindKey,
                tMap: JSON.stringify(tMap),
                bMap: JSON.stringify(bMap),
                propertyNames
            };
        })
    };
};

describe('JSX dom literals', () => {

    test('hello azoth', ({ expect }) => {
        const input = `const t = <p className={status}>Hello {name}</p>;`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t08c985bf } from 'virtual:azoth-templates?id=08c985bf';

          const t = t08c985bf(status,name);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1]",
              "bindKey": "c339ed9e",
              "html": "<p>Hello <!--0--></p>",
              "id": "08c985bf",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[-1,[1]]",
              "targetKey": "0fb6cfb2",
            },
          ]
        `);
    });

    test('spread prop', ({ expect }) => {
        const { code, templates } = compile(`const t = <p {...obj}></p>;`);

        expect(code).toMatchInlineSnapshot(`
          "import { t3c5a1ff8 } from 'virtual:azoth-templates?id=3c5a1ff8';

          const t = t3c5a1ff8(obj);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[4]",
              "bindKey": "4b227777",
              "html": "<p></p>",
              "id": "3c5a1ff8",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[-1]",
              "targetKey": "1bad6b8c",
            },
          ]
        `);
    });

    test('complex template with props and child nodes', ({ expect }) => {
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
          "import { tb1f5ad01 } from 'virtual:azoth-templates?id=b1f5ad01';

          const t = tb1f5ad01("my-class","felix","this is","azoth","two","and...","span-class","ul-footer","footer");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1,1,1,1,1,0,1,1]",
              "bindKey": "d435024a",
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
              "id": "b1f5ad01",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[0,[0,0],[1,0],[2,0],[4,1],[4,3],5,[3,7],[15]]",
              "targetKey": "5e529f02",
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
          "import { tfcd1ffcb } from 'virtual:azoth-templates?id=fcd1ffcb';

          const t = tfcd1ffcb("className","name","class","class-name");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,-1,-2,-3]",
              "bindKey": "2329cdfb",
              "html": "<input required>",
              "id": "fcd1ffcb",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
                "name",
                "class",
                "class-name",
              ],
              "tMap": "[-1,-1,-1,-1]",
              "targetKey": "6fb139e0",
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
          "import { t508fe350, t7c7d5ba2 } from 'virtual:azoth-templates?id=508fe350&id=7c7d5ba2';

          t508fe350(t7c7d5ba2());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<div><!--0--></div>",
              "id": "508fe350",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr>",
              "id": "7c7d5ba2",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
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
          "import { td0a26d23 } from 'virtual:azoth-templates?id=d0a26d23';

          const template = td0a26d23();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<p>Hello</p>",
              "id": "d0a26d23",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
          ]
        `);
    });
});

describe('fragments', () => {
    test('empty', ({ expect }) => {
        const input = `
            const fragment = <><hr/><hr/></>;
            const compose = <>{x}</>;
            const empty = <></>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t4d7e131d, t13fcceb0, te3b0c442 } from 'virtual:azoth-templates?id=4d7e131d&id=13fcceb0&id=e3b0c442';

          const fragment = t4d7e131d();
          const compose = t13fcceb0(x);
          const empty = null;
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr><hr>",
              "id": "4d7e131d",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<!--0-->",
              "id": "13fcceb0",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": true,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
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
          "import { t4d7e131d, t7c7d5ba2, t13fcceb0, te3b0c442, te39bbbf6 } from 'virtual:azoth-templates?id=4d7e131d&id=7c7d5ba2&id=13fcceb0&id=e3b0c442&id=e39bbbf6';

          const fragment = t4d7e131d();
          const single = t7c7d5ba2();
          const fragInFrag = t7c7d5ba2();
          const fragInFragCompose = t13fcceb0(x);
          const empty = null;
          const compose = t13fcceb0(x);
          const text = te39bbbf6();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr><hr>",
              "id": "4d7e131d",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr>",
              "id": "7c7d5ba2",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr>",
              "id": "7c7d5ba2",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<!--0-->",
              "id": "13fcceb0",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": true,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<!--0-->",
              "id": "13fcceb0",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "
                          text
                      ",
              "id": "e39bbbf6",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
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
          "import { t7c7d5ba2, t13fcceb0 } from 'virtual:azoth-templates?id=7c7d5ba2&id=13fcceb0';

          const start = t7c7d5ba2();
          const end = t7c7d5ba2();
          const composeStart = t13fcceb0(x);
          const composeEnd = t13fcceb0(x);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr>",
              "id": "7c7d5ba2",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr>",
              "id": "7c7d5ba2",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<!--0-->",
              "id": "13fcceb0",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<!--0-->",
              "id": "13fcceb0",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
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
          "import { te6b959a5, tc94e198a, t5c4a1a25, t1a0f564d, tf7de14d9 } from 'virtual:azoth-templates?id=e6b959a5&id=c94e198a&id=5c4a1a25&id=1a0f564d&id=f7de14d9';

          const fragment = te6b959a5();
          const single = tc94e198a();
          const fragInFrag = t5c4a1a25();
          const spaces = t1a0f564d();
          const compose = tf7de14d9(x);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": " <hr><hr> ",
              "id": "e6b959a5",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": " <hr> ",
              "id": "c94e198a",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "  <hr>  ",
              "id": "5c4a1a25",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "    ",
              "id": "1a0f564d",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": " <!--0--> ",
              "id": "f7de14d9",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "6b86b273",
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
          "import { td05ef376 } from 'virtual:azoth-templates?id=d05ef376';

          const fragment = td05ef376("two");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "one<!--0-->three",
              "id": "d05ef376",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "6b86b273",
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
          "import { t6cad6a72, te5273e1c } from 'virtual:azoth-templates?id=6cad6a72&id=e5273e1c';

          const extraneous = t6cad6a72();
          const childNodeIndex = te5273e1c("expect index 3");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<div><hr><hr><hr></div>",
              "id": "6cad6a72",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<div>
                          <p></p>
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "e5273e1c",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[3]]",
              "targetKey": "4e074085",
            },
          ]
        `);

    });

    test('edge case: <>{...}<el>{...}</el></>', ({ expect }) => {
        const input = `const App = <>{'foo'}<main>{'bar'}</main>{'qux'}</>;`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t831ae748 } from 'virtual:azoth-templates?id=831ae748';

          const App = t831ae748('foo','bar','qux');
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1,1,1]",
              "bindKey": "e379918b",
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "831ae748",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[0,0],[2]]",
              "targetKey": "1b763775",
            },
          ]
        `);

    });
});

describe('components and custom element', () => {

    test('custom-element with property', ({ expect }) => {
        const input = `
            document.body.append(<custom-element prop={prop}/>);
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t1d4ac292 } from 'virtual:azoth-templates?id=1d4ac292';

          document.body.append(t1d4ac292(prop));
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<custom-element></custom-element>",
              "id": "1d4ac292",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "prop",
              ],
              "tMap": "[-1]",
              "targetKey": "1bad6b8c",
            },
          ]
        `);

    });

    test('top level components: empty and with props', ({ expect }) => {
        const input = `
            const c = <Component/>;
            const cProps = <Component prop={value} {...spread} attr="static"/>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { __rC } from 'azoth/runtime';

          const c = __rC(Component);
          const cProps = __rC(Component, { prop: value, ...spread, attr: "static", });
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
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
          "import { t328a0d18 } from 'virtual:azoth-templates?id=328a0d18';

          const component = t328a0d18([Component, { prop: value, prop2: "literal", }],[GotNoPropsAsYouCanSee]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[2,2]",
              "bindKey": "5705c50c",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "328a0d18",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3]]",
              "targetKey": "b4920aa4",
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
          "import { __rC } from 'azoth/runtime';
          import { t82b8fd58 } from 'virtual:azoth-templates?id=82b8fd58';
          const $A = __rC(A);
          const $B = __rC(B);
          const dom = t82b8fd58($A,$B);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "82b8fd58",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3]]",
              "targetKey": "b4920aa4",
            },
          ]
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
          "import { __rC } from 'azoth/runtime';
          import { t77e67b80, t982d9e3e, ta50ab0a9 } from 'virtual:azoth-templates?id=77e67b80&id=982d9e3e&id=a50ab0a9';
          const c = __rC(Component, null, t77e67b80("test"));
          const cTrim = __rC(Component, null, t77e67b80("test"));
          const cTrimStart = __rC(Component, null, t77e67b80("test"));
          const cTrimEnd = __rC(Component, null, t77e67b80("test"));
          const cText = __rC(Component, null, t982d9e3e());
          const cFrag = __rC(Component, null, ta50ab0a9(1,2));
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<p><!--0--></p>",
              "id": "77e67b80",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<p><!--0--></p>",
              "id": "77e67b80",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<p><!--0--></p>",
              "id": "77e67b80",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<p><!--0--></p>",
              "id": "77e67b80",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "text",
              "id": "982d9e3e",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<p data-bind><!--0--></p>
                          <p data-bind><!--0--></p>",
              "id": "a50ab0a9",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0,0],[1,0]]",
              "targetKey": "c85f7c17",
            },
          ]
        `);
    });

    test('compose component', ({ expect }) => {
        const input = `
            const component = <div>
                <Component></Component>
                <Component prop={value} prop2="literal"></Component>
                <Component><p>slottable</p></Component>
                <Component prop={value} prop2="literal"><p>slottable</p></Component>
            </div>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { tf5eba66c, t372bc820 } from 'virtual:azoth-templates?id=f5eba66c&id=372bc820';

          const component = tf5eba66c([Component],[Component, { prop: value, prop2: "literal", }],[Component, null, t372bc820()],[Component, { prop: value, prop2: "literal", }, t372bc820()]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[2,2,2,2]",
              "bindKey": "e02b3f1c",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "f5eba66c",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3],[5],[7]]",
              "targetKey": "435e1bf6",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<p>slottable</p>",
              "id": "372bc820",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<p>slottable</p>",
              "id": "372bc820",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
          ]
        `);
    });
});

describe('render and composition cases', () => {

    test('simple render', ({ expect }) => {
        const input = `
            const Item = name => <p>{name}</p>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t77e67b80 } from 'virtual:azoth-templates?id=77e67b80';

          const Item = name => t77e67b80(name);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<p><!--0--></p>",
              "id": "77e67b80",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
          ]
        `);
    });

    test('map in block', ({ expect }) => {
        const input = `
            const Item = name => <li>{name}</li>;
            const Template = () => <div>{[2, 4, 7].map(Item)}{"text"}</div>
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t4be044f9, t18b03572 } from 'virtual:azoth-templates?id=4be044f9&id=18b03572';

          const Item = name => t4be044f9(name);
          const Template = () => t18b03572([2, 4, 7].map(Item),"text");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<li><!--0--></li>",
              "id": "4be044f9",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<div><!--0--><!--0--></div>",
              "id": "18b03572",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[1]]",
              "targetKey": "c339ed9e",
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
          "import { t4be044f9, tb2903d6d } from 'virtual:azoth-templates?id=4be044f9&id=b2903d6d';

          const Emoji = ({name}) => t4be044f9(name);
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = tb2903d6d(promise);
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<li><!--0--></li>",
              "id": "4be044f9",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<ul><!--0--></ul>",
              "id": "b2903d6d",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
          ]
        `);
    });

    test('export edge case', ({ expect }) => {
        const input = `
            export const Loading = () => <p>loading...</p>;
            export const Cat = ({ name }) => <p>{name}</p>;
            export const CatList = cats => <ul>{cats.map(Cat)}</ul>;
            export const CatCount = cats => <p>{cats.length} cats</p>;
            export const CatName = (name) => <li>{name}</li>;
            export const CatNames = cats => <ul>{cats.map(CatName)}</ul>;
        `;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t191b5e03, t77e67b80, tb2903d6d, t44ba17ec, t4be044f9 } from 'virtual:azoth-templates?id=191b5e03&id=77e67b80&id=b2903d6d&id=44ba17ec&id=4be044f9';

          export const Loading = () => t191b5e03();
          export const Cat = ({name}) => t77e67b80(name);
          export const CatList = cats => tb2903d6d(cats.map(Cat));
          export const CatCount = cats => t44ba17ec(cats.length);
          export const CatName = name => t4be044f9(name);
          export const CatNames = cats => tb2903d6d(cats.map(CatName));
          "
        `);
    });

    test('nested elements with children', ({ expect }) => {
        const input = `
            const t1 = <li>{priority}{exit}</li>;
            const t2 = <div><li>
                {priority}
                {exit}
            </li></div>;
            const t3 = <li>
                <h1>{priority}</h1>
                <p>{exit}</p>
            </li>;
        `;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t01729576, t9b074a03, td0c13d59 } from 'virtual:azoth-templates?id=01729576&id=9b074a03&id=d0c13d59';

          const t1 = t01729576(priority,exit);
          const t2 = t9b074a03(priority,exit);
          const t3 = td0c13d59(priority,exit);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<li><!--0--><!--0--></li>",
              "id": "01729576",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[1]]",
              "targetKey": "c339ed9e",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<div><li data-bind>
                          <!--0-->
                          <!--0-->
                      </li></div>",
              "id": "9b074a03",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0,1],[0,3]]",
              "targetKey": "f36a4fcc",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<li>
                          <h1 data-bind><!--0--></h1>
                          <p data-bind><!--0--></p>
                      </li>",
              "id": "d0c13d59",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0,0],[1,0]]",
              "targetKey": "c85f7c17",
            },
          ]
        `);
    });

});

describe('controller', () => {

    test('basic', ({ expect }) => {
        const input = `
            const C = Updater.for(({ status }, slottable) => <p className={"status"}>
                {slottable}
            </p>);
            const Greeting = Controller.for( ({ name }) => <span>Hello {name}</span>)
            const greeting = Greeting.render(data);
            const t = <C status={status}>{greeting}</C>;  
        `;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { __rC } from 'azoth/runtime';
          import { tdd5eeb7f, tfe4e62e3, t13fcceb0 } from 'virtual:azoth-templates?id=dd5eeb7f&id=fe4e62e3&id=13fcceb0';
          const C = Updater.for(({status}, slottable) => tdd5eeb7f("status",slottable));
          const Greeting = Controller.for(({name}) => tfe4e62e3(name));
          const greeting = Greeting.render(data);
          const t = __rC(C, { status: status, }, t13fcceb0(greeting));
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1]",
              "bindKey": "c339ed9e",
              "html": "<p>
                          <!--0-->
                      </p>",
              "id": "dd5eeb7f",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[-1,[1]]",
              "targetKey": "0fb6cfb2",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<span>Hello <!--0--></span>",
              "id": "fe4e62e3",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "6b86b273",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "e3b0c442",
              "isDomFragment": false,
              "isEmpty": true,
              "propertyNames": null,
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<!--0-->",
              "id": "13fcceb0",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
          ]
        `);
    });
});
