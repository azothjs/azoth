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
          "import { tee909dab } from 'virtual:azoth-templates?id=ee909dab';

          const t = tee909dab(status,name);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1]",
              "bindKey": "b413f47d",
              "html": "<p>Hello <!--0--></p>",
              "id": "ee909dab",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[-1,[1]]",
              "targetKey": "437cb43a",
            },
          ]
        `);
    });

    test('spread prop', ({ expect }) => {
        const { code, templates } = compile(`const t = <p {...obj}></p>;`);

        expect(code).toMatchInlineSnapshot(`
          "import { t8ae413f2 } from 'virtual:azoth-templates?id=8ae413f2';

          const t = t8ae413f2(obj);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[4]",
              "bindKey": "e52d9c50",
              "html": "<p></p>",
              "id": "8ae413f2",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[-1]",
              "targetKey": "a8100ae6",
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
          "import { t72066b6d } from 'virtual:azoth-templates?id=72066b6d';

          const t = t72066b6d("my-class","felix","this is","azoth","two","and...","span-class","ul-footer","footer");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1,1,1,1,1,0,1,1]",
              "bindKey": "f113ea14",
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
              "id": "72066b6d",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[0,[0,0],[1,0],[2,0],[4,1],[4,3],5,[3,7],[15]]",
              "targetKey": "5cfa32c5",
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
          "import { tb3e1f174 } from 'virtual:azoth-templates?id=b3e1f174';

          const t = tb3e1f174("className","name","class","class-name");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,-1,-2,-3]",
              "bindKey": "94251893",
              "html": "<input required>",
              "id": "b3e1f174",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
                "name",
                "class",
                "class-name",
              ],
              "tMap": "[-1,-1,-1,-1]",
              "targetKey": "ad95131b",
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
          "import { t897b4a32, t7c7d5ba2 } from 'virtual:azoth-templates?id=897b4a32&id=7c7d5ba2';

          t897b4a32(t7c7d5ba2());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "4bf5122f",
              "html": "<div><!--0--></div>",
              "id": "897b4a32",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
          "import { t4d7e131d, te9ee46e2, te3b0c442 } from 'virtual:azoth-templates?id=4d7e131d&id=e9ee46e2&id=e3b0c442';

          const fragment = t4d7e131d();
          const compose = te9ee46e2(x);
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
              "bindKey": "4bf5122f",
              "html": "<!--0-->",
              "id": "e9ee46e2",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
          "import { t4d7e131d, t7c7d5ba2, te9ee46e2, te3b0c442, te39bbbf6 } from 'virtual:azoth-templates?id=4d7e131d&id=7c7d5ba2&id=e9ee46e2&id=e3b0c442&id=e39bbbf6';

          const fragment = t4d7e131d();
          const single = t7c7d5ba2();
          const fragInFrag = t7c7d5ba2();
          const fragInFragCompose = te9ee46e2(x);
          const empty = null;
          const compose = te9ee46e2(x);
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
              "bindKey": "4bf5122f",
              "html": "<!--0-->",
              "id": "e9ee46e2",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
              "bindKey": "4bf5122f",
              "html": "<!--0-->",
              "id": "e9ee46e2",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
          "import { t7c7d5ba2, te9ee46e2 } from 'virtual:azoth-templates?id=7c7d5ba2&id=e9ee46e2';

          const start = t7c7d5ba2();
          const end = t7c7d5ba2();
          const composeStart = te9ee46e2(x);
          const composeEnd = te9ee46e2(x);
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
              "bindKey": "4bf5122f",
              "html": "<!--0-->",
              "id": "e9ee46e2",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
            },
            {
              "bMap": "[1]",
              "bindKey": "4bf5122f",
              "html": "<!--0-->",
              "id": "e9ee46e2",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
          "import { te6b959a5, tc94e198a, t5c4a1a25, t1a0f564d, t6f02034b } from 'virtual:azoth-templates?id=e6b959a5&id=c94e198a&id=5c4a1a25&id=1a0f564d&id=6f02034b';

          const fragment = te6b959a5();
          const single = tc94e198a();
          const fragInFrag = t5c4a1a25();
          const spaces = t1a0f564d();
          const compose = t6f02034b(x);
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
              "bindKey": "4bf5122f",
              "html": " <!--0--> ",
              "id": "6f02034b",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "4bf5122f",
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
          "import { tb4e37a5c } from 'virtual:azoth-templates?id=b4e37a5c';

          const fragment = tb4e37a5c("two");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "4bf5122f",
              "html": "one<!--0-->three",
              "id": "b4e37a5c",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "4bf5122f",
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
          "import { t6cad6a72, t84ebad93 } from 'virtual:azoth-templates?id=6cad6a72&id=84ebad93';

          const extraneous = t6cad6a72();
          const childNodeIndex = t84ebad93("expect index 3");
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
              "bindKey": "4bf5122f",
              "html": "<div>
                          <p></p>
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "84ebad93",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[3]]",
              "targetKey": "084fed08",
            },
          ]
        `);

    });

    test('edge case: <>{...}<el>{...}</el></>', ({ expect }) => {
        const input = `const App = <>{'foo'}<main>{'bar'}</main>{'qux'}</>;`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { te936c736 } from 'virtual:azoth-templates?id=e936c736';

          const App = te936c736('foo','bar','qux');
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1,1,1]",
              "bindKey": "75c8fd04",
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "e936c736",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[0,0],[2]]",
              "targetKey": "65d27a48",
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
          "import { t0b860ee7 } from 'virtual:azoth-templates?id=0b860ee7';

          document.body.append(t0b860ee7(prop));
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "6e340b9c",
              "html": "<custom-element></custom-element>",
              "id": "0b860ee7",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "prop",
              ],
              "tMap": "[-1]",
              "targetKey": "a8100ae6",
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
          "import { tffd26772 } from 'virtual:azoth-templates?id=ffd26772';

          const component = tffd26772([Component, { prop: value, prop2: "literal", }],[GotNoPropsAsYouCanSee]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[2,2]",
              "bindKey": "50cff72c",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "ffd26772",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3]]",
              "targetKey": "c79b932e",
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
          import { tb1661d2c } from 'virtual:azoth-templates?id=b1661d2c';
          const $A = __rC(A);
          const $B = __rC(B);
          const dom = tb1661d2c($A,$B);
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
              "bindKey": "9dcf97a1",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "b1661d2c",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3]]",
              "targetKey": "c79b932e",
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
          import { t06fd0cf3, t982d9e3e, t9d841c48 } from 'virtual:azoth-templates?id=06fd0cf3&id=982d9e3e&id=9d841c48';
          const c = __rC(Component, null, t06fd0cf3("test"));
          const cTrim = __rC(Component, null, t06fd0cf3("test"));
          const cTrimStart = __rC(Component, null, t06fd0cf3("test"));
          const cTrimEnd = __rC(Component, null, t06fd0cf3("test"));
          const cText = __rC(Component, null, t982d9e3e());
          const cFrag = __rC(Component, null, t9d841c48(1,2));
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
              "bindKey": "4bf5122f",
              "html": "<p><!--0--></p>",
              "id": "06fd0cf3",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
              "bindKey": "4bf5122f",
              "html": "<p><!--0--></p>",
              "id": "06fd0cf3",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
              "bindKey": "4bf5122f",
              "html": "<p><!--0--></p>",
              "id": "06fd0cf3",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
              "bindKey": "4bf5122f",
              "html": "<p><!--0--></p>",
              "id": "06fd0cf3",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
              "bindKey": "9dcf97a1",
              "html": "<p data-bind><!--0--></p>
                          <p data-bind><!--0--></p>",
              "id": "9d841c48",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0,0],[1,0]]",
              "targetKey": "96a296d2",
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
          "import { tdcf43654, t372bc820 } from 'virtual:azoth-templates?id=dcf43654&id=372bc820';

          const component = tdcf43654([Component],[Component, { prop: value, prop2: "literal", }],[Component, null, t372bc820()],[Component, { prop: value, prop2: "literal", }, t372bc820()]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[2,2,2,2]",
              "bindKey": "bb72b4e4",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "dcf43654",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3],[5],[7]]",
              "targetKey": "e6e8cb42",
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

    test('map in block', ({ expect }) => {
        const input = `
            const Item = name => <li>{name}</li>;
            const Template = () => <div>{[2, 4, 7].map(Item)}{"text"}</div>
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t05c79d3c, t10e4f7ba } from 'virtual:azoth-templates?id=05c79d3c&id=10e4f7ba';

          const Item = name => t05c79d3c(name);
          const Template = () => t10e4f7ba([2, 4, 7].map(Item),"text");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "4bf5122f",
              "html": "<li><!--0--></li>",
              "id": "05c79d3c",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "9dcf97a1",
              "html": "<div><!--0--><!--0--></div>",
              "id": "10e4f7ba",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[1]]",
              "targetKey": "b413f47d",
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
          "import { t05c79d3c, tac31183b } from 'virtual:azoth-templates?id=05c79d3c&id=ac31183b';

          const Emoji = ({name}) => t05c79d3c(name);
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = tac31183b(promise);
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "4bf5122f",
              "html": "<li><!--0--></li>",
              "id": "05c79d3c",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
            },
            {
              "bMap": "[1]",
              "bindKey": "4bf5122f",
              "html": "<ul><!--0--></ul>",
              "id": "ac31183b",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
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
          "import { t191b5e03, t06fd0cf3, tac31183b, tb05f589f, t05c79d3c } from 'virtual:azoth-templates?id=191b5e03&id=06fd0cf3&id=ac31183b&id=b05f589f&id=05c79d3c';

          export const Loading = () => t191b5e03();
          export const Cat = ({name}) => t06fd0cf3(name);
          export const CatList = cats => tac31183b(cats.map(Cat));
          export const CatCount = cats => tb05f589f(cats.length);
          export const CatName = name => t05c79d3c(name);
          export const CatNames = cats => tac31183b(cats.map(CatName));
          "
        `);
    });

    test('nested elements with children', ({ expect }) => {
        const input = `
            const t1 = <li>{priority}{exit}</li>
            const t2 = <li>
                <h1>{priority}</h1>
                <p>{exit}</p>
            </li>
        `;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { td6226395, t63f1381f } from 'virtual:azoth-templates?id=d6226395&id=63f1381f';

          const t1 = td6226395(priority,exit);
          const t2 = t63f1381f(priority,exit);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1,1]",
              "bindKey": "9dcf97a1",
              "html": "<li><!--0--><!--0--></li>",
              "id": "d6226395",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[1]]",
              "targetKey": "b413f47d",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "9dcf97a1",
              "html": "<li>
                          <h1 data-bind><!--0--></h1>
                          <p data-bind><!--0--></p>
                      </li>",
              "id": "63f1381f",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0,0],[1,0]]",
              "targetKey": "96a296d2",
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
          import { t71052812, ta71d269a, te9ee46e2 } from 'virtual:azoth-templates?id=71052812&id=a71d269a&id=e9ee46e2';
          const C = Updater.for(({status}, slottable) => t71052812("status",slottable));
          const Greeting = Controller.for(({name}) => ta71d269a(name));
          const greeting = Greeting.render(data);
          const t = __rC(C, { status: status, }, te9ee46e2(greeting));
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1]",
              "bindKey": "b413f47d",
              "html": "<p>
                          <!--0-->
                      </p>",
              "id": "71052812",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[-1,[1]]",
              "targetKey": "437cb43a",
            },
            {
              "bMap": "[1]",
              "bindKey": "4bf5122f",
              "html": "<span>Hello <!--0--></span>",
              "id": "a71d269a",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "4bf5122f",
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
              "bindKey": "4bf5122f",
              "html": "<!--0-->",
              "id": "e9ee46e2",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "6e340b9c",
            },
          ]
        `);
    });
});
