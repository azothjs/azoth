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
          "import { tf75dd533 } from 'virtual:azoth-templates?id=f75dd533';

          const t = tf75dd533(status,name);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1]",
              "bindKey": "4e0c0070",
              "html": "<p>Hello <!--az:0--></p>",
              "id": "f75dd533",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[-1,[1]]",
              "targetKey": "43606b94",
            },
          ]
        `);
    });

    test('spread prop', ({ expect }) => {
        const { code, templates } = compile(`const t = <p {...obj}></p>;`);

        expect(code).toMatchInlineSnapshot(`
          "import { t3f4bfb48 } from 'virtual:azoth-templates?id=3f4bfb48';

          const t = t3f4bfb48(obj);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[4]",
              "bindKey": "4b227777",
              "html": "<p></p>",
              "id": "3f4bfb48",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[-1]",
              "targetKey": "d124b23c",
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
          "import { t31ec496e } from 'virtual:azoth-templates?id=31ec496e';

          const t = t31ec496e("my-class","felix","this is","azoth","two","and...","span-class","ul-footer","footer");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1,1,1,1,1,0,1,1]",
              "bindKey": "eb5ef6f1",
              "html": "<div>
                      <p data-bind><!--az:0--></p>
                      <p>static</p>
                      <p data-bind><!--az:0--><span data-bind><!--az:0--></span></p>
                      <ul data-bind>
                          <li><span>one</span></li>
                          <li><span><em data-bind>a<!--az:0-->b<!--az:0-->c</em></span></li>
                          <li><span data-bind>three</span></li>
                          <!--az:0-->
                      </ul>
                      <img>
                      <custom-element></custom-element>
                      <custom-element></custom-element>
                      <!--az:0-->
                  </div>",
              "id": "31ec496e",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[0,[0,0],[1,0],[2,0],[4,1],[4,3],5,[3,7],[15]]",
              "targetKey": "f5006542",
            },
          ]
        `);
    });

    test('property names', ({ expect }) => {
        const input = `const t = <input
            required
            className={"className"}
            name={"name"}
            value={"value"}
            data-name={"data-name"}
        />;`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t4154283f } from 'virtual:azoth-templates?id=4154283f';

          const t = t4154283f("className","name","value","data-name");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,-1,-2,-3]",
              "bindKey": "d94bd6e8",
              "html": "<input required>",
              "id": "4154283f",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
                "name",
                "value",
                "data-name",
              ],
              "tMap": "[-1,-1,-1,-1]",
              "targetKey": "b6fc661c",
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
          "import { tab3e976a, t7c7d5ba2 } from 'virtual:azoth-templates?id=ab3e976a&id=7c7d5ba2';

          tab3e976a(t7c7d5ba2());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<div><!--az:0--></div>",
              "id": "ab3e976a",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
          "import { t4d7e131d, t82eaa447 } from 'virtual:azoth-templates?id=4d7e131d&id=82eaa447';

          const fragment = t4d7e131d();
          const compose = t82eaa447(x);
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
              "html": "<!--az:0-->",
              "id": "82eaa447",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
          "import { t4d7e131d, t7c7d5ba2, t7c7d5ba2_1, t82eaa447, t82eaa447_1, te39bbbf6 } from 'virtual:azoth-templates?id=4d7e131d&id=7c7d5ba2&id=7c7d5ba2&id=82eaa447&id=82eaa447&id=e39bbbf6';

          const fragment = t4d7e131d();
          const single = t7c7d5ba2();
          const fragInFrag = t7c7d5ba2_1();
          const fragInFragCompose = t82eaa447(x);
          const empty = null;
          const compose = t82eaa447_1(x);
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
              "html": "<!--az:0-->",
              "id": "82eaa447",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
              "html": "<!--az:0-->",
              "id": "82eaa447",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
          "import { t7c7d5ba2, t7c7d5ba2_1, t82eaa447, t82eaa447_1 } from 'virtual:azoth-templates?id=7c7d5ba2&id=7c7d5ba2&id=82eaa447&id=82eaa447';

          const start = t7c7d5ba2();
          const end = t7c7d5ba2_1();
          const composeStart = t82eaa447(x);
          const composeEnd = t82eaa447_1(x);
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
              "html": "<!--az:0-->",
              "id": "82eaa447",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<!--az:0-->",
              "id": "82eaa447",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
          "import { te6b959a5, tc94e198a, t5c4a1a25, t1a0f564d, t93caf444 } from 'virtual:azoth-templates?id=e6b959a5&id=c94e198a&id=5c4a1a25&id=1a0f564d&id=93caf444';

          const fragment = te6b959a5();
          const single = tc94e198a();
          const fragInFrag = t5c4a1a25();
          const spaces = t1a0f564d();
          const compose = t93caf444(x);
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
              "html": " <!--az:0--> ",
              "id": "93caf444",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "043f347c",
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
          "import { tc622f79b } from 'virtual:azoth-templates?id=c622f79b';

          const fragment = tc622f79b("two");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "one<!--az:0-->three",
              "id": "c622f79b",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "043f347c",
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
          "import { t6cad6a72, t900c12ff } from 'virtual:azoth-templates?id=6cad6a72&id=900c12ff';

          const extraneous = t6cad6a72();
          const childNodeIndex = t900c12ff("expect index 3");
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
                          <!--az:0--><p></p>
                          <p></p>
                      </div>",
              "id": "900c12ff",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[3]]",
              "targetKey": "a9ae641b",
            },
          ]
        `);

    });

    test('edge case: <>{...}<el>{...}</el></>', ({ expect }) => {
        const input = `const App = <>{'foo'}<main>{'bar'}</main>{'qux'}</>;`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { tde54e34c } from 'virtual:azoth-templates?id=de54e34c';

          const App = tde54e34c('foo','bar','qux');
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1,1,1]",
              "bindKey": "e379918b",
              "html": "<!--az:0--><main data-bind><!--az:0--></main><!--az:0-->",
              "id": "de54e34c",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[0,0],[2]]",
              "targetKey": "b86339ff",
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
          "import { t35bb20c5 } from 'virtual:azoth-templates?id=35bb20c5';

          document.body.append(t35bb20c5(prop));
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "5a0f450d",
              "html": "<custom-element></custom-element>",
              "id": "35bb20c5",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "prop",
              ],
              "tMap": "[-1]",
              "targetKey": "d124b23c",
            },
          ]
        `);

    });

    test('boolean props without values', ({ expect }) => {
        const input = `
            const c = <Component flag />;
            const cProps = <Component flag other={value} />;
            const nested = <div><Component flag /></div>;
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { __createComponent } from 'azoth/runtime';
          import { t2947668f } from 'virtual:azoth-templates?id=2947668f';
          const c = __createComponent(Component, { flag: true, });
          const cProps = __createComponent(Component, { flag: true, other: value, });
          const nested = t2947668f([Component, { flag: true, }]);
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
              "bMap": "[2]",
              "bindKey": "d4735e3a",
              "html": "<div><!--az:0--></div>",
              "id": "2947668f",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
          "import { __createComponent } from 'azoth/runtime';

          const c = __createComponent(Component, {});
          const cProps = __createComponent(Component, { prop: value, ...spread, attr: "static", });
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

    test('component prop keys that are not valid identifiers are quoted', ({ expect }) => {
        const input = `const c = <Component data-id={x} aria-label={y} name={z} />;`;
        const { code } = compile(input);
        expect(code).toMatchInlineSnapshot(`
          "import { __createComponent } from 'azoth/runtime';

          const c = __createComponent(Component, { "data-id": x, "aria-label": y, name: z, });
          "
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
          "import { tf12e4cd7 } from 'virtual:azoth-templates?id=f12e4cd7';

          const component = tf12e4cd7([Component, { prop: value, prop2: "literal", }],[GotNoPropsAsYouCanSee, {}]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[2,2]",
              "bindKey": "5705c50c",
              "html": "<div>
                          <!--az:0-->
                          <!--az:0-->
                      </div>",
              "id": "f12e4cd7",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3]]",
              "targetKey": "7d255a37",
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
          "import { __createComponent } from 'azoth/runtime';
          import { ta876bc75 } from 'virtual:azoth-templates?id=a876bc75';
          const $A = __createComponent(A, {});
          const $B = __createComponent(B, {});
          const dom = ta876bc75($A,$B);
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
                          <!--az:0-->
                          <!--az:0-->
                      </div>",
              "id": "a876bc75",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3]]",
              "targetKey": "7d255a37",
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
          "import { __createComponent } from 'azoth/runtime';
          import { t2daa7bd4, t2daa7bd4_1, t2daa7bd4_2, t2daa7bd4_3, t982d9e3e, tbfd81445 } from 'virtual:azoth-templates?id=2daa7bd4&id=2daa7bd4&id=2daa7bd4&id=2daa7bd4&id=982d9e3e&id=bfd81445';
          const c = __createComponent(Component, {}, t2daa7bd4("test"));
          const cTrim = __createComponent(Component, {}, t2daa7bd4_1("test"));
          const cTrimStart = __createComponent(Component, {}, t2daa7bd4_2("test"));
          const cTrimEnd = __createComponent(Component, {}, t2daa7bd4_3("test"));
          const cText = __createComponent(Component, {}, t982d9e3e());
          const cFrag = __createComponent(Component, {}, tbfd81445(1,2));
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
              "html": "<p><!--az:0--></p>",
              "id": "2daa7bd4",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
              "html": "<p><!--az:0--></p>",
              "id": "2daa7bd4",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
              "html": "<p><!--az:0--></p>",
              "id": "2daa7bd4",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
              "html": "<p><!--az:0--></p>",
              "id": "2daa7bd4",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
              "html": "<p data-bind><!--az:0--></p>
                          <p data-bind><!--az:0--></p>",
              "id": "bfd81445",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0,0],[1,0]]",
              "targetKey": "0588b209",
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
          "import { t0605e0ce, t372bc820, t372bc820_1 } from 'virtual:azoth-templates?id=0605e0ce&id=372bc820&id=372bc820';

          const component = t0605e0ce([Component, {}],[Component, { prop: value, prop2: "literal", }],[Component, {}, t372bc820()],[Component, { prop: value, prop2: "literal", }, t372bc820_1()]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[2,2,2,2]",
              "bindKey": "e02b3f1c",
              "html": "<div>
                          <!--az:0-->
                          <!--az:0-->
                          <!--az:0-->
                          <!--az:0-->
                      </div>",
              "id": "0605e0ce",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1],[3],[5],[7]]",
              "targetKey": "4c2c171f",
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
          "import { t2daa7bd4 } from 'virtual:azoth-templates?id=2daa7bd4';

          const Item = name => t2daa7bd4(name);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<p><!--az:0--></p>",
              "id": "2daa7bd4",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
          "import { td5d01530, tbcc2daaf } from 'virtual:azoth-templates?id=d5d01530&id=bcc2daaf';

          const Item = name => td5d01530(name);
          const Template = () => tbcc2daaf([2, 4, 7].map(Item),"text");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<li><!--az:0--></li>",
              "id": "d5d01530",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<div><!--az:0--><!--az:0--></div>",
              "id": "bcc2daaf",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[1]]",
              "targetKey": "57361b63",
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
          "import { td5d01530, t5028a4a6 } from 'virtual:azoth-templates?id=d5d01530&id=5028a4a6';

          const Emoji = ({name}) => td5d01530(name);
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = t5028a4a6(promise);
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<li><!--az:0--></li>",
              "id": "d5d01530",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<ul><!--az:0--></ul>",
              "id": "5028a4a6",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
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
          "import { t191b5e03, t2daa7bd4, t5028a4a6, tfaceb5b0, td5d01530, t5028a4a6_1 } from 'virtual:azoth-templates?id=191b5e03&id=2daa7bd4&id=5028a4a6&id=faceb5b0&id=d5d01530&id=5028a4a6';

          export const Loading = () => t191b5e03();
          export const Cat = ({name}) => t2daa7bd4(name);
          export const CatList = cats => t5028a4a6(cats.map(Cat));
          export const CatCount = cats => tfaceb5b0(cats.length);
          export const CatName = name => td5d01530(name);
          export const CatNames = cats => t5028a4a6_1(cats.map(CatName));
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
          "import { t6f3fc4d6, t2ac7fbe0, tbe60a3f8 } from 'virtual:azoth-templates?id=6f3fc4d6&id=2ac7fbe0&id=be60a3f8';

          const t1 = t6f3fc4d6(priority,exit);
          const t2 = t2ac7fbe0(priority,exit);
          const t3 = tbe60a3f8(priority,exit);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<li><!--az:0--><!--az:0--></li>",
              "id": "6f3fc4d6",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0],[1]]",
              "targetKey": "57361b63",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<div><li data-bind>
                          <!--az:0-->
                          <!--az:0-->
                      </li></div>",
              "id": "2ac7fbe0",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0,1],[0,3]]",
              "targetKey": "b62da878",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<li>
                          <h1 data-bind><!--az:0--></h1>
                          <p data-bind><!--az:0--></p>
                      </li>",
              "id": "be60a3f8",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0,0],[1,0]]",
              "targetKey": "0588b209",
            },
          ]
        `);
    });

});

describe('controller', () => {

    test('basic', ({ expect }) => {
        const input = `
            const C = Updater.for(({ status }, childNodes) => <p className={"status"}>
                {childNodes}
            </p>);
            const Greeting = Controller.for( ({ name }) => <span>Hello {name}</span>)
            const greeting = Greeting.render(data);
            const t = <C status={status}>{greeting}</C>;  
        `;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { __createComponent } from 'azoth/runtime';
          import { t2e8a37b1, t94eae132, t82eaa447 } from 'virtual:azoth-templates?id=2e8a37b1&id=94eae132&id=82eaa447';
          const C = Updater.for(({status}, childNodes) => t2e8a37b1("status",childNodes));
          const Greeting = Controller.for(({name}) => t94eae132(name));
          const greeting = Greeting.render(data);
          const t = __createComponent(C, { status: status, }, t82eaa447(greeting));
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1]",
              "bindKey": "4e0c0070",
              "html": "<p>
                          <!--az:0-->
                      </p>",
              "id": "2e8a37b1",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
              ],
              "tMap": "[-1,[1]]",
              "targetKey": "43606b94",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<span>Hello <!--az:0--></span>",
              "id": "94eae132",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[1]]",
              "targetKey": "043f347c",
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
              "html": "<!--az:0-->",
              "id": "82eaa447",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
            },
          ]
        `);
    });
});

describe('template key generation', () => {

    test('targetKey must distinguish root vs child element bindings', ({ expect }) => {
        // This test ensures that templates with different binding targets
        // (root element vs child element) get different targetKeys.
        //
        // Bug: Array.join(';') flattens nested arrays, causing collision:
        //   [0].join(';') === [[0]].join(';') === "0"
        //
        // The tMap structure differs:
        //   - Property on child element: tMap = [queryIndex] e.g. [0]
        //   - Child content on root:     tMap = [[childIndex]] e.g. [[0]]
        //
        // These must hash to different targetKeys to avoid the wrong
        // target function being used at runtime.

        // Pattern 1: Property binding on CHILD element (like DashboardHeader img src)
        const childBinding = compile(`
            const logo = 'logo.png';
            const Header = () => <header><img src={logo} /></header>;
        `);

        // Pattern 2: Child content binding on ROOT element (like CardTitle {title})
        const rootBinding = compile(`
            const Title = ({ title }) => <h2>{title}</h2>;
        `);

        const childTemplate = childBinding.templates[0];
        const rootTemplate = rootBinding.templates[0];

        // Verify the tMap structures are what we expect
        expect(childTemplate.tMap).toBe('[0]');      // queryIndex 0 (child img)
        expect(rootTemplate.tMap).toBe('[[0]]');    // [childIndex 0] (root h2)

        // THE KEY ASSERTION: These must have DIFFERENT targetKeys
        // If they collide, the wrong target function gets reused,
        // causing runtime errors when the vite-plugin deduplicates
        expect(childTemplate.targetKey).not.toBe(rootTemplate.targetKey);
    });

});
