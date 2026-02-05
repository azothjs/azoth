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
          "import { tf01dc508 } from 'virtual:azoth-templates?id=f01dc508';

          const t = tf01dc508(status,name);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1]",
              "bindKey": "4e0c0070",
              "html": "<p>Hello <!--0--></p>",
              "id": "f01dc508",
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
          "import { t8627c9e3 } from 'virtual:azoth-templates?id=8627c9e3';

          const t = t8627c9e3("my-class","felix","this is","azoth","two","and...","span-class","ul-footer","footer");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1,1,1,1,1,0,1,1]",
              "bindKey": "eb5ef6f1",
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
              "id": "8627c9e3",
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
            class={"class"}
            class-name={"class-name"}
        />;`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { td1b379f7 } from 'virtual:azoth-templates?id=d1b379f7';

          const t = td1b379f7("className","name","class","class-name");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,-1,-2,-3]",
              "bindKey": "59709254",
              "html": "<input required>",
              "id": "d1b379f7",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": [
                "className",
                "name",
                "class",
                "class-name",
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
          "import { t96f4098c, t7c7d5ba2 } from 'virtual:azoth-templates?id=96f4098c&id=7c7d5ba2';

          t96f4098c(t7c7d5ba2());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<div><!--0--></div>",
              "id": "96f4098c",
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
          "import { t4d7e131d, t286a9d57, te3b0c442 } from 'virtual:azoth-templates?id=4d7e131d&id=286a9d57&id=e3b0c442';

          const fragment = t4d7e131d();
          const compose = t286a9d57(x);
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
              "id": "286a9d57",
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
          "import { t4d7e131d, t7c7d5ba2, t286a9d57, te3b0c442, te39bbbf6 } from 'virtual:azoth-templates?id=4d7e131d&id=7c7d5ba2&id=286a9d57&id=e3b0c442&id=e39bbbf6';

          const fragment = t4d7e131d();
          const single = t7c7d5ba2();
          const fragInFrag = t7c7d5ba2();
          const fragInFragCompose = t286a9d57(x);
          const empty = null;
          const compose = t286a9d57(x);
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
              "id": "286a9d57",
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
              "html": "<!--0-->",
              "id": "286a9d57",
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
          "import { t7c7d5ba2, t286a9d57 } from 'virtual:azoth-templates?id=7c7d5ba2&id=286a9d57';

          const start = t7c7d5ba2();
          const end = t7c7d5ba2();
          const composeStart = t286a9d57(x);
          const composeEnd = t286a9d57(x);
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
              "id": "286a9d57",
              "isDomFragment": true,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<!--0-->",
              "id": "286a9d57",
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
          "import { te6b959a5, tc94e198a, t5c4a1a25, t1a0f564d, t78539c9f } from 'virtual:azoth-templates?id=e6b959a5&id=c94e198a&id=5c4a1a25&id=1a0f564d&id=78539c9f';

          const fragment = te6b959a5();
          const single = tc94e198a();
          const fragInFrag = t5c4a1a25();
          const spaces = t1a0f564d();
          const compose = t78539c9f(x);
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
              "id": "78539c9f",
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
          "import { tdbd37a5c } from 'virtual:azoth-templates?id=dbd37a5c';

          const fragment = tdbd37a5c("two");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "one<!--0-->three",
              "id": "dbd37a5c",
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
          "import { t6cad6a72, t7e490c7a } from 'virtual:azoth-templates?id=6cad6a72&id=7e490c7a';

          const extraneous = t6cad6a72();
          const childNodeIndex = t7e490c7a("expect index 3");
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
              "id": "7e490c7a",
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
          "import { t0d36279e } from 'virtual:azoth-templates?id=0d36279e';

          const App = t0d36279e('foo','bar','qux');
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1,1,1]",
              "bindKey": "e379918b",
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "0d36279e",
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
          "import { __rC } from 'azoth/runtime';
          import { tdb0b7033 } from 'virtual:azoth-templates?id=db0b7033';
          const c = __rC(Component, { flag: true, });
          const cProps = __rC(Component, { flag: true, other: value, });
          const nested = tdb0b7033([Component, { flag: true, }]);
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
              "html": "<div><!--0--></div>",
              "id": "db0b7033",
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
          "import { __rC } from 'azoth/runtime';

          const c = __rC(Component, {});
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
          "import { t862eb095 } from 'virtual:azoth-templates?id=862eb095';

          const component = t862eb095([Component, { prop: value, prop2: "literal", }],[GotNoPropsAsYouCanSee, {}]);
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
              "id": "862eb095",
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
          "import { __rC } from 'azoth/runtime';
          import { t6e8375c4 } from 'virtual:azoth-templates?id=6e8375c4';
          const $A = __rC(A, {});
          const $B = __rC(B, {});
          const dom = t6e8375c4($A,$B);
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
              "id": "6e8375c4",
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
          "import { __rC } from 'azoth/runtime';
          import { t15aa2705, t982d9e3e, t9155678a } from 'virtual:azoth-templates?id=15aa2705&id=982d9e3e&id=9155678a';
          const c = __rC(Component, {}, t15aa2705("test"));
          const cTrim = __rC(Component, {}, t15aa2705("test"));
          const cTrimStart = __rC(Component, {}, t15aa2705("test"));
          const cTrimEnd = __rC(Component, {}, t15aa2705("test"));
          const cText = __rC(Component, {}, t982d9e3e());
          const cFrag = __rC(Component, {}, t9155678a(1,2));
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
              "id": "15aa2705",
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
              "html": "<p><!--0--></p>",
              "id": "15aa2705",
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
              "html": "<p><!--0--></p>",
              "id": "15aa2705",
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
              "html": "<p><!--0--></p>",
              "id": "15aa2705",
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
              "html": "<p data-bind><!--0--></p>
                          <p data-bind><!--0--></p>",
              "id": "9155678a",
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
          "import { t4c71fc70, t372bc820 } from 'virtual:azoth-templates?id=4c71fc70&id=372bc820';

          const component = t4c71fc70([Component, {}],[Component, { prop: value, prop2: "literal", }],[Component, {}, t372bc820()],[Component, { prop: value, prop2: "literal", }, t372bc820()]);
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
              "id": "4c71fc70",
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
          "import { t15aa2705 } from 'virtual:azoth-templates?id=15aa2705';

          const Item = name => t15aa2705(name);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<p><!--0--></p>",
              "id": "15aa2705",
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
          "import { tfbb7e8b4, t84a8f6bb } from 'virtual:azoth-templates?id=fbb7e8b4&id=84a8f6bb';

          const Item = name => tfbb7e8b4(name);
          const Template = () => t84a8f6bb([2, 4, 7].map(Item),"text");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<li><!--0--></li>",
              "id": "fbb7e8b4",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
            },
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<div><!--0--><!--0--></div>",
              "id": "84a8f6bb",
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
          "import { tfbb7e8b4, t3fcf8b87 } from 'virtual:azoth-templates?id=fbb7e8b4&id=3fcf8b87';

          const Emoji = ({name}) => tfbb7e8b4(name);
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = t3fcf8b87(promise);
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<li><!--0--></li>",
              "id": "fbb7e8b4",
              "isDomFragment": false,
              "isEmpty": false,
              "propertyNames": null,
              "tMap": "[[0]]",
              "targetKey": "db407f11",
            },
            {
              "bMap": "[1]",
              "bindKey": "6b86b273",
              "html": "<ul><!--0--></ul>",
              "id": "3fcf8b87",
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
          "import { t191b5e03, t15aa2705, t3fcf8b87, t2c4a6c0f, tfbb7e8b4 } from 'virtual:azoth-templates?id=191b5e03&id=15aa2705&id=3fcf8b87&id=2c4a6c0f&id=fbb7e8b4';

          export const Loading = () => t191b5e03();
          export const Cat = ({name}) => t15aa2705(name);
          export const CatList = cats => t3fcf8b87(cats.map(Cat));
          export const CatCount = cats => t2c4a6c0f(cats.length);
          export const CatName = name => tfbb7e8b4(name);
          export const CatNames = cats => t3fcf8b87(cats.map(CatName));
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
          "import { tcc027210, t1dfe7c9b, t178111e9 } from 'virtual:azoth-templates?id=cc027210&id=1dfe7c9b&id=178111e9';

          const t1 = tcc027210(priority,exit);
          const t2 = t1dfe7c9b(priority,exit);
          const t3 = t178111e9(priority,exit);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[1,1]",
              "bindKey": "ac4750db",
              "html": "<li><!--0--><!--0--></li>",
              "id": "cc027210",
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
                          <!--0-->
                          <!--0-->
                      </li></div>",
              "id": "1dfe7c9b",
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
                          <h1 data-bind><!--0--></h1>
                          <p data-bind><!--0--></p>
                      </li>",
              "id": "178111e9",
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
          import { t3514925d, tab8527d7, t286a9d57 } from 'virtual:azoth-templates?id=3514925d&id=ab8527d7&id=286a9d57';
          const C = Updater.for(({status}, slottable) => t3514925d("status",slottable));
          const Greeting = Controller.for(({name}) => tab8527d7(name));
          const greeting = Greeting.render(data);
          const t = __rC(C, { status: status, }, t286a9d57(greeting));
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,1]",
              "bindKey": "4e0c0070",
              "html": "<p>
                          <!--0-->
                      </p>",
              "id": "3514925d",
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
              "html": "<span>Hello <!--0--></span>",
              "id": "ab8527d7",
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
              "html": "<!--0-->",
              "id": "286a9d57",
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
