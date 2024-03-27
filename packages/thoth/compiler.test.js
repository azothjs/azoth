/* eslint-disable no-undef */
import { compile as _compile } from './compiler.js';
import { describe, test } from 'vitest';

const compile = input => {
    const { code, templates, map } = _compile(input, {
        generate: { indent: '    ' }
    });
    return {
        code, map,
        templates: templates.map(({ id, targetKey, bindKey, html, isDomFragment, isEmpty, tMap, bMap, pMap }) => {
            return {
                id, html, isDomFragment, isEmpty, targetKey, bindKey,
                tMap: JSON.stringify(tMap),
                bMap: JSON.stringify(bMap),
                pMap: JSON.stringify(pMap),
            };
        })
    };
};

describe('JSX dom literals', () => {

    test('hello azoth', ({ expect }) => {
        const input = `const t = <p className={status}>Hello {name}</p>;`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t3fc11fd6 } from 'virtual:azoth-templates?id=3fc11fd6';

          const t = t3fc11fd6(status,name);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0],0]",
              "bindKey": "acd79dc7",
              "html": "<p>Hello <!--0--></p>",
              "id": "3fc11fd6",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["className"]",
              "tMap": "[-1,[1]]",
              "targetKey": "8a918b5b",
            },
          ]
        `);
    });

    test('spread prop', ({ expect }) => {
        const { code, templates } = compile(`const t = <p {...obj}></p>;`);

        expect(code).toMatchInlineSnapshot(`
          "import { tda30746b } from 'virtual:azoth-templates?id=da30746b';

          const t = tda30746b(obj);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[2]",
              "bindKey": "d4735e3a",
              "html": "<p></p>",
              "id": "da30746b",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
          "import { t9a7c9cc9 } from 'virtual:azoth-templates?id=9a7c9cc9';

          const t = t9a7c9cc9("my-class","felix","this is","azoth","two","and...","span-class","ul-footer","footer");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0],0,0,0,0,0,[1,0],0,0]",
              "bindKey": "10360597",
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
              "id": "9a7c9cc9",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["className"]",
              "tMap": "[0,[0,0],[1,0],[2,0],[4,1],[4,3],5,[3,7],[15]]",
              "targetKey": "27562130",
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
          "import { t7031c6b3 } from 'virtual:azoth-templates?id=7031c6b3';

          const t = t7031c6b3("className","name","class","class-name");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0],[1,1],[1,2],[1,3]]",
              "bindKey": "27cbbeaa",
              "html": "<input required>",
              "id": "7031c6b3",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["className","name","class","class-name"]",
              "tMap": "[-1,-1,-1,-1]",
              "targetKey": "582a358f",
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
          "import { t00864888, t7c7d5ba2 } from 'virtual:azoth-templates?id=00864888&id=7c7d5ba2';

          t00864888(t7c7d5ba2());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<div><!--0--></div>",
              "id": "00864888",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
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
              "pMap": "null",
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
          "import { t4d7e131d, t136c6d6b, te3b0c442 } from 'virtual:azoth-templates?id=4d7e131d&id=136c6d6b&id=e3b0c442';

          const fragment = t4d7e131d();
          const compose = t136c6d6b(x);
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<!--0-->",
              "id": "136c6d6b",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
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
          "import { t4d7e131d, t7c7d5ba2, t136c6d6b, te3b0c442, te39bbbf6 } from 'virtual:azoth-templates?id=4d7e131d&id=7c7d5ba2&id=136c6d6b&id=e3b0c442&id=e39bbbf6';

          const fragment = t4d7e131d();
          const single = t7c7d5ba2();
          const fragInFrag = t7c7d5ba2();
          const fragInFragCompose = t136c6d6b(x);
          const empty = null;
          const compose = t136c6d6b(x);
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
              "pMap": "null",
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
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<!--0-->",
              "id": "136c6d6b",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<!--0-->",
              "id": "136c6d6b",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
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
          "import { t7c7d5ba2, t136c6d6b } from 'virtual:azoth-templates?id=7c7d5ba2&id=136c6d6b';

          const start = t7c7d5ba2();
          const end = t7c7d5ba2();
          const composeStart = t136c6d6b(x);
          const composeEnd = t136c6d6b(x);
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
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<!--0-->",
              "id": "136c6d6b",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<!--0-->",
              "id": "136c6d6b",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
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
          "import { te6b959a5, tc94e198a, t5c4a1a25, t1a0f564d, tac0e35e4 } from 'virtual:azoth-templates?id=e6b959a5&id=c94e198a&id=5c4a1a25&id=1a0f564d&id=ac0e35e4';

          const fragment = te6b959a5();
          const single = tc94e198a();
          const fragInFrag = t5c4a1a25();
          const spaces = t1a0f564d();
          const compose = tac0e35e4(x);
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
              "pMap": "null",
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
              "pMap": "null",
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
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": " <!--0--> ",
              "id": "ac0e35e4",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
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
          "import { t88062041 } from 'virtual:azoth-templates?id=88062041';

          const fragment = t88062041("two");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "one<!--0-->three",
              "id": "88062041",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
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
          "import { t6cad6a72, t646f93dc } from 'virtual:azoth-templates?id=6cad6a72&id=646f93dc';

          const extraneous = t6cad6a72();
          const childNodeIndex = t646f93dc("expect index 3");
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<div>
                          <p></p>
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "646f93dc",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
          "import { t2ea2af44 } from 'virtual:azoth-templates?id=2ea2af44';

          const App = t2ea2af44('foo','bar','qux');
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,0,0]",
              "bindKey": "7c01691d",
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "2ea2af44",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0],[0,0],[2]]",
              "targetKey": "71a10168",
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
          "import { t22c6d34d } from 'virtual:azoth-templates?id=22c6d34d';

          document.body.append(t22c6d34d(prop));
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0]]",
              "bindKey": "b0e4f9bb",
              "html": "<custom-element></custom-element>",
              "id": "22c6d34d",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["prop"]",
              "tMap": "[-1]",
              "targetKey": "1bad6b8c",
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
          "import { __rC } from 'azoth/runtime';

          const c = __rC(Component, true);
          const cProps = __rC(Component, { prop: value, attr: "static", }, true);
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
              "pMap": "null",
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
              "pMap": "null",
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
          "import { t0d76db2c } from 'virtual:azoth-templates?id=0d76db2c';

          const component = t0d76db2c([Component, { prop: value, prop2: "literal", }],[GotNoPropsAsYouCanSee]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,0]",
              "bindKey": "73348214",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "0d76db2c",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1],[3]]",
              "targetKey": "ef96f1f6",
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
          import { t0d76db2c } from 'virtual:azoth-templates?id=0d76db2c';
          const $A = __rC(A, true);
          const $B = __rC(B, true);
          const dom = t0d76db2c($A,$B);
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
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0,0]",
              "bindKey": "73348214",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "0d76db2c",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1],[3]]",
              "targetKey": "ef96f1f6",
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
          import { t8c36c09e, t982d9e3e, t1befd3dd } from 'virtual:azoth-templates?id=8c36c09e&id=982d9e3e&id=1befd3dd';
          const c = __rC(Component, null, t8c36c09e("test"), true);
          const cTrim = __rC(Component, null, t8c36c09e("test"), true);
          const cTrimStart = __rC(Component, null, t8c36c09e("test"), true);
          const cTrimEnd = __rC(Component, null, t8c36c09e("test"), true);
          const cText = __rC(Component, null, t982d9e3e(), true);
          const cFrag = __rC(Component, null, t1befd3dd(1,2), true);
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<p><!--0--></p>",
              "id": "8c36c09e",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<p><!--0--></p>",
              "id": "8c36c09e",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<p><!--0--></p>",
              "id": "8c36c09e",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<p><!--0--></p>",
              "id": "8c36c09e",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
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
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0,0]",
              "bindKey": "73348214",
              "html": "<p data-bind><!--0--></p>
                          <p data-bind><!--0--></p>",
              "id": "1befd3dd",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0,0],[1,0]]",
              "targetKey": "7e4c73a9",
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
          "import { tb5dae465, t372bc820 } from 'virtual:azoth-templates?id=b5dae465&id=372bc820';

          const component = tb5dae465([Component],[Component, { prop: value, prop2: "literal", }],[Component, null, t372bc820()],[Component, { prop: value, prop2: "literal", }, t372bc820()]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,0,0,0]",
              "bindKey": "4040da0f",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "b5dae465",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1],[3],[5],[7]]",
              "targetKey": "cde164be",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<p>slottable</p>",
              "id": "372bc820",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
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
          "import { t4a5c2312, t8cd69a7f } from 'virtual:azoth-templates?id=4a5c2312&id=8cd69a7f';

          const Item = name => t4a5c2312(name);
          const Template = () => t8cd69a7f([2, 4, 7].map(Item),"text");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<li><!--0--></li>",
              "id": "4a5c2312",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "[0,0]",
              "bindKey": "73348214",
              "html": "<div><!--0--><!--0--></div>",
              "id": "8cd69a7f",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0],[1]]",
              "targetKey": "83b97b85",
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
          "import { t4a5c2312, t42562575 } from 'virtual:azoth-templates?id=4a5c2312&id=42562575';

          const Emoji = ({name}) => t4a5c2312(name);
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = t42562575(promise);
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<li><!--0--></li>",
              "id": "4a5c2312",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<ul><!--0--></ul>",
              "id": "42562575",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
          "import { t191b5e03, t8c36c09e, t42562575, t3de8bc74, t4a5c2312 } from 'virtual:azoth-templates?id=191b5e03&id=8c36c09e&id=42562575&id=3de8bc74&id=4a5c2312';

          export const Loading = () => t191b5e03();
          export const Cat = ({name}) => t8c36c09e(name);
          export const CatList = cats => t42562575(cats.map(Cat));
          export const CatCount = cats => t3de8bc74(cats.length);
          export const CatName = name => t4a5c2312(name);
          export const CatNames = cats => t42562575(cats.map(CatName));
          "
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
          import { tae9f11ad, tbd90ea5e, t136c6d6b } from 'virtual:azoth-templates?id=ae9f11ad&id=bd90ea5e&id=136c6d6b';
          const C = Updater.for(({status}, slottable) => tae9f11ad("status",slottable));
          const Greeting = Controller.for(({name}) => tbd90ea5e(name));
          const greeting = Greeting.render(data);
          const t = __rC(C, { status: status, }, t136c6d6b(greeting), true);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0],0]",
              "bindKey": "acd79dc7",
              "html": "<p>
                          <!--0-->
                      </p>",
              "id": "ae9f11ad",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["className"]",
              "tMap": "[-1,[1]]",
              "targetKey": "8a918b5b",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<span>Hello <!--0--></span>",
              "id": "bd90ea5e",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
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
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "5feceb66",
              "html": "<!--0-->",
              "id": "136c6d6b",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "5feceb66",
            },
          ]
        `);
    });
});
