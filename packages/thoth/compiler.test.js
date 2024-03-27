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
          "import { ta57d19ed56 } from 'virtual:azoth-templates?id=a57d19ed56';

          const t = ta57d19ed56(status,name);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0],0]",
              "bindKey": "177795b654",
              "html": "<p>Hello <!--0--></p>",
              "id": "a57d19ed56",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["className"]",
              "tMap": "[-1,[1]]",
              "targetKey": "f47d786139",
            },
          ]
        `);
    });

    test('spread prop', ({ expect }) => {
        const { code, templates } = compile(`const t = <p {...obj}></p>;`);

        expect(code).toMatchInlineSnapshot(`
          "import { t936a31da2d } from 'virtual:azoth-templates?id=936a31da2d';

          const t = t936a31da2d(obj);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[2]",
              "bindKey": "c81e728d9d",
              "html": "<p></p>",
              "id": "936a31da2d",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[-1]",
              "targetKey": "6bb61e3b7b",
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
          "import { t3226f9a27b } from 'virtual:azoth-templates?id=3226f9a27b';

          const t = t3226f9a27b("my-class","felix","this is","azoth","two","and...","span-class","ul-footer","footer");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0],0,0,0,0,0,[1,0],0,0]",
              "bindKey": "587ed7acc1",
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
              "id": "3226f9a27b",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["className"]",
              "tMap": "[0,[0,0],[1,0],[2,0],[4,1],[4,3],5,[3,7],[15]]",
              "targetKey": "22c6b31e88",
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
          "import { t824364e2cc } from 'virtual:azoth-templates?id=824364e2cc';

          const t = t824364e2cc("className","name","class","class-name");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0],[1,1],[1,2],[1,3]]",
              "bindKey": "062a1a942f",
              "html": "<input required>",
              "id": "824364e2cc",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["className","name","class","class-name"]",
              "tMap": "[-1,-1,-1,-1]",
              "targetKey": "bf9e6a2ab4",
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
          "import { td25bb8e18c, t1a78cbe949 } from 'virtual:azoth-templates?id=d25bb8e18c&id=1a78cbe949';

          td25bb8e18c(t1a78cbe949());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<div><!--0--></div>",
              "id": "d25bb8e18c",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr>",
              "id": "1a78cbe949",
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
          "import { t5bf3d2f523 } from 'virtual:azoth-templates?id=5bf3d2f523';

          const template = t5bf3d2f523();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<p>Hello</p>",
              "id": "5bf3d2f523",
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
          "import { tc203fe7dcd, t126f2ff76c, td41d8cd98f } from 'virtual:azoth-templates?id=c203fe7dcd&id=126f2ff76c&id=d41d8cd98f';

          const fragment = tc203fe7dcd();
          const compose = t126f2ff76c(x);
          const empty = null;
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr><hr>",
              "id": "c203fe7dcd",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<!--0-->",
              "id": "126f2ff76c",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
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
          "import { tc203fe7dcd, t1a78cbe949, t126f2ff76c, td41d8cd98f, t6c72de769d } from 'virtual:azoth-templates?id=c203fe7dcd&id=1a78cbe949&id=126f2ff76c&id=d41d8cd98f&id=6c72de769d';

          const fragment = tc203fe7dcd();
          const single = t1a78cbe949();
          const fragInFrag = t1a78cbe949();
          const fragInFragCompose = t126f2ff76c(x);
          const empty = null;
          const compose = t126f2ff76c(x);
          const text = t6c72de769d();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr><hr>",
              "id": "c203fe7dcd",
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
              "id": "1a78cbe949",
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
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<!--0-->",
              "id": "126f2ff76c",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": true,
              "isEmpty": true,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<!--0-->",
              "id": "126f2ff76c",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "
                          text
                      ",
              "id": "6c72de769d",
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
          "import { t1a78cbe949, t126f2ff76c } from 'virtual:azoth-templates?id=1a78cbe949&id=126f2ff76c';

          const start = t1a78cbe949();
          const end = t1a78cbe949();
          const composeStart = t126f2ff76c(x);
          const composeEnd = t126f2ff76c(x);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<hr>",
              "id": "1a78cbe949",
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
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<!--0-->",
              "id": "126f2ff76c",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<!--0-->",
              "id": "126f2ff76c",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
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
          "import { t653a3aad80, tdcaa233028, t2dc1738d5c, t0cf31b2c28, t4427700897 } from 'virtual:azoth-templates?id=653a3aad80&id=dcaa233028&id=2dc1738d5c&id=0cf31b2c28&id=4427700897';

          const fragment = t653a3aad80();
          const single = tdcaa233028();
          const fragInFrag = t2dc1738d5c();
          const spaces = t0cf31b2c28();
          const compose = t4427700897(x);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": " <hr><hr> ",
              "id": "653a3aad80",
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
              "id": "dcaa233028",
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
              "id": "2dc1738d5c",
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
              "id": "0cf31b2c28",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": " <!--0--> ",
              "id": "4427700897",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1]]",
              "targetKey": "c4ca4238a0",
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
          "import { t874cbbd133 } from 'virtual:azoth-templates?id=874cbbd133';

          const fragment = t874cbbd133("two");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "one<!--0-->three",
              "id": "874cbbd133",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1]]",
              "targetKey": "c4ca4238a0",
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
          "import { tccaa44c114, t97d865d58d } from 'virtual:azoth-templates?id=ccaa44c114&id=97d865d58d';

          const extraneous = tccaa44c114();
          const childNodeIndex = t97d865d58d("expect index 3");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<div><hr><hr><hr></div>",
              "id": "ccaa44c114",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<div>
                          <p></p>
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "97d865d58d",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[3]]",
              "targetKey": "eccbc87e4b",
            },
          ]
        `);

    });

    test('edge case: <>{...}<el>{...}</el></>', ({ expect }) => {
        const input = `const App = <>{'foo'}<main>{'bar'}</main>{'qux'}</>;`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t7d946297a3 } from 'virtual:azoth-templates?id=7d946297a3';

          const App = t7d946297a3('foo','bar','qux');
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,0,0]",
              "bindKey": "9e776694a3",
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "7d946297a3",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0],[0,0],[2]]",
              "targetKey": "adac036e0a",
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
          "import { t862cb9697e } from 'virtual:azoth-templates?id=862cb9697e';

          document.body.append(t862cb9697e(prop));
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0]]",
              "bindKey": "d414495308",
              "html": "<custom-element></custom-element>",
              "id": "862cb9697e",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["prop"]",
              "tMap": "[-1]",
              "targetKey": "6bb61e3b7b",
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
          import { td41d8cd98f } from 'virtual:azoth-templates?id=d41d8cd98f';
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
              "id": "d41d8cd98f",
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
              "id": "d41d8cd98f",
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
          "import { t0aafca8fa0 } from 'virtual:azoth-templates?id=0aafca8fa0';

          const component = t0aafca8fa0([Component, { prop: value, prop2: "literal", }],[GotNoPropsAsYouCanSee]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,0]",
              "bindKey": "fc3ce29e4c",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "0aafca8fa0",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1],[3]]",
              "targetKey": "e034c70ba2",
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
          import { td41d8cd98f, t0aafca8fa0 } from 'virtual:azoth-templates?id=d41d8cd98f&id=0aafca8fa0';
          const $A = __rC(A, true);
          const $B = __rC(B, true);
          const dom = t0aafca8fa0($A,$B);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
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
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0,0]",
              "bindKey": "fc3ce29e4c",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "0aafca8fa0",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1],[3]]",
              "targetKey": "e034c70ba2",
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
          import { td41d8cd98f, t6bf5e94b46, t1cb251ec0d, t876561d8be } from 'virtual:azoth-templates?id=d41d8cd98f&id=6bf5e94b46&id=1cb251ec0d&id=876561d8be';
          const c = __rC(Component, null, t6bf5e94b46("test"), true);
          const cTrim = __rC(Component, null, t6bf5e94b46("test"), true);
          const cTrimStart = __rC(Component, null, t6bf5e94b46("test"), true);
          const cTrimEnd = __rC(Component, null, t6bf5e94b46("test"), true);
          const cText = __rC(Component, null, t1cb251ec0d(), true);
          const cFrag = __rC(Component, null, t876561d8be(1,2), true);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<p><!--0--></p>",
              "id": "6bf5e94b46",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<p><!--0--></p>",
              "id": "6bf5e94b46",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<p><!--0--></p>",
              "id": "6bf5e94b46",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<p><!--0--></p>",
              "id": "6bf5e94b46",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
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
              "id": "1cb251ec0d",
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
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0,0]",
              "bindKey": "fc3ce29e4c",
              "html": "<p data-bind><!--0--></p>
                          <p data-bind><!--0--></p>",
              "id": "876561d8be",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0,0],[1,0]]",
              "targetKey": "427ddb6b0b",
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
          "import { t2db334f20a, t1b39ba0acc } from 'virtual:azoth-templates?id=2db334f20a&id=1b39ba0acc';

          const component = t2db334f20a([Component],[Component, { prop: value, prop2: "literal", }],[Component, null, t1b39ba0acc()],[Component, { prop: value, prop2: "literal", }, t1b39ba0acc()]);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0,0,0,0]",
              "bindKey": "886364986c",
              "html": "<div>
                          <!--0-->
                          <!--0-->
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "2db334f20a",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1],[3],[5],[7]]",
              "targetKey": "07df094c67",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "<p>slottable</p>",
              "id": "1b39ba0acc",
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
              "id": "1b39ba0acc",
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
          "import { t4499130e13, t013b9489ab } from 'virtual:azoth-templates?id=4499130e13&id=013b9489ab';

          const Item = name => t4499130e13(name);
          const Template = () => t013b9489ab([2, 4, 7].map(Item),"text");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<li><!--0--></li>",
              "id": "4499130e13",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "[0,0]",
              "bindKey": "fc3ce29e4c",
              "html": "<div><!--0--><!--0--></div>",
              "id": "013b9489ab",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0],[1]]",
              "targetKey": "d192e0c4ad",
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
          "import { t4499130e13, tdf8076d019 } from 'virtual:azoth-templates?id=4499130e13&id=df8076d019';

          const Emoji = ({name}) => t4499130e13(name);
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = tdf8076d019(promise);
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<li><!--0--></li>",
              "id": "4499130e13",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<ul><!--0--></ul>",
              "id": "df8076d019",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
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
          "import { t35b2653e5d, t6bf5e94b46, tdf8076d019, tf0cd5e093f, t4499130e13 } from 'virtual:azoth-templates?id=35b2653e5d&id=6bf5e94b46&id=df8076d019&id=f0cd5e093f&id=4499130e13';

          export const Loading = () => t35b2653e5d();
          export const Cat = ({name}) => t6bf5e94b46(name);
          export const CatList = cats => tdf8076d019(cats.map(Cat));
          export const CatCount = cats => tf0cd5e093f(cats.length);
          export const CatName = name => t4499130e13(name);
          export const CatNames = cats => tdf8076d019(cats.map(CatName));
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
          import { t4a5af28a9a, tfe01791b59, td41d8cd98f, t126f2ff76c } from 'virtual:azoth-templates?id=4a5af28a9a&id=fe01791b59&id=d41d8cd98f&id=126f2ff76c';
          const C = Updater.for(({status}, slottable) => t4a5af28a9a("status",slottable));
          const Greeting = Controller.for(({name}) => tfe01791b59(name));
          const greeting = Greeting.render(data);
          const t = __rC(C, { status: status, }, t126f2ff76c(greeting), true);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "bMap": "[[1,0],0]",
              "bindKey": "177795b654",
              "html": "<p>
                          <!--0-->
                      </p>",
              "id": "4a5af28a9a",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "["className"]",
              "tMap": "[-1,[1]]",
              "targetKey": "f47d786139",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<span>Hello <!--0--></span>",
              "id": "fe01791b59",
              "isDomFragment": false,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[1]]",
              "targetKey": "c4ca4238a0",
            },
            {
              "bMap": "null",
              "bindKey": "",
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "pMap": "null",
              "tMap": "null",
              "targetKey": "",
            },
            {
              "bMap": "[0]",
              "bindKey": "cfcd208495",
              "html": "<!--0-->",
              "id": "126f2ff76c",
              "isDomFragment": true,
              "isEmpty": false,
              "pMap": "null",
              "tMap": "[[0]]",
              "targetKey": "cfcd208495",
            },
          ]
        `);
    });
});
