/* eslint-disable no-undef */
import { compile as _compile } from './compiler.js';
import { describe, test } from 'vitest';

const compile = input => {
    const { code, templates, map } = _compile(input, {
        generate: { indent: '    ' }
    });
    return {
        code, map,
        templates: templates.map(({ id, childBindKey, propBindKey, html, isDomFragment, isEmpty }) => {
            return { id, childBindKey, propBindKey, html, isDomFragment, isEmpty };
        })
    };
};

describe('JSX dom literals', () => {

    test('Hello Azoth', ({ expect }) => {
        const input = `const t = <p className={"className"}>
            Hello {"Azoth"}
        </p>;`;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { tf312946f36 } from 'virtual:azoth-templates?id=f312946f36';

          const t = tf312946f36("className","Azoth");
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<p>
                      Hello <!--0-->
                  </p>",
              "id": "f312946f36",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
          ]
        `);
    });

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
          "import { t9fcf48061b } from 'virtual:azoth-templates?id=9fcf48061b';

          const t = t9fcf48061b("my-class","felix","this is","azoth","two","and...","span-class","ul-footer","footer");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
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
              "id": "9fcf48061b",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { tfef7238342 } from 'virtual:azoth-templates?id=fef7238342';

          const t = tfef7238342("className","name","class","class-name");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<input required>",
              "id": "fef7238342",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { t728beb50f0, t1a78cbe949 } from 'virtual:azoth-templates?id=728beb50f0&id=1a78cbe949';

          t728beb50f0(t1a78cbe949());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<div><!--0--></div>",
              "id": "728beb50f0",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
              "childBindKey": undefined,
              "html": "<p>Hello</p>",
              "id": "5bf3d2f523",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { tc203fe7dcd, t84c9741b4d, td41d8cd98f } from 'virtual:azoth-templates?id=c203fe7dcd&id=84c9741b4d&id=d41d8cd98f';

          const fragment = tc203fe7dcd();
          const compose = t84c9741b4d(x);
          const empty = null;
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<hr><hr>",
              "id": "c203fe7dcd",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<!--0-->",
              "id": "84c9741b4d",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": true,
              "isEmpty": true,
              "propBindKey": undefined,
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
          "import { tc203fe7dcd, t1a78cbe949, t84c9741b4d, td41d8cd98f, t6c72de769d } from 'virtual:azoth-templates?id=c203fe7dcd&id=1a78cbe949&id=84c9741b4d&id=d41d8cd98f&id=6c72de769d';

          const fragment = tc203fe7dcd();
          const single = t1a78cbe949();
          const fragInFrag = t1a78cbe949();
          const fragInFragCompose = t84c9741b4d(x);
          const empty = null;
          const compose = t84c9741b4d(x);
          const text = t6c72de769d();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<hr><hr>",
              "id": "c203fe7dcd",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<!--0-->",
              "id": "84c9741b4d",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": true,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<!--0-->",
              "id": "84c9741b4d",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "
                          text
                      ",
              "id": "6c72de769d",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { t1a78cbe949, t84c9741b4d } from 'virtual:azoth-templates?id=1a78cbe949&id=84c9741b4d';

          const start = t1a78cbe949();
          const end = t1a78cbe949();
          const composeStart = t84c9741b4d(x);
          const composeEnd = t84c9741b4d(x);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<!--0-->",
              "id": "84c9741b4d",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<!--0-->",
              "id": "84c9741b4d",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { t653a3aad80, tdcaa233028, t2dc1738d5c, t0cf31b2c28, t3c41ad0e2b } from 'virtual:azoth-templates?id=653a3aad80&id=dcaa233028&id=2dc1738d5c&id=0cf31b2c28&id=3c41ad0e2b';

          const fragment = t653a3aad80();
          const single = tdcaa233028();
          const fragInFrag = t2dc1738d5c();
          const spaces = t0cf31b2c28();
          const compose = t3c41ad0e2b(x);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": " <hr><hr> ",
              "id": "653a3aad80",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": " <hr> ",
              "id": "dcaa233028",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "  <hr>  ",
              "id": "2dc1738d5c",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "    ",
              "id": "0cf31b2c28",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": " <!--0--> ",
              "id": "3c41ad0e2b",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { t253e2ffa84 } from 'virtual:azoth-templates?id=253e2ffa84';

          const fragment = t253e2ffa84("two");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "one<!--0-->three",
              "id": "253e2ffa84",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { tccaa44c114, taccbe53128 } from 'virtual:azoth-templates?id=ccaa44c114&id=accbe53128';

          const extraneous = tccaa44c114();
          const childNodeIndex = taccbe53128("expect index 3");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<div><hr><hr><hr></div>",
              "id": "ccaa44c114",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<div>
                          <p></p>
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "accbe53128",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
          ]
        `);

    });

    test('edge case: <>{...}<el>{...}</el></>', ({ expect }) => {
        const input = `const App = <>{'foo'}<main>{'bar'}</main>{'qux'}</>;`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t97874fe2c4 } from 'virtual:azoth-templates?id=97874fe2c4';

          const App = t97874fe2c4('foo','bar','qux');
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "97874fe2c4",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { tb3611c2834 } from 'virtual:azoth-templates?id=b3611c2834';

          document.body.append(tb3611c2834(prop));
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<custom-element></custom-element>",
              "id": "b3611c2834",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { __createElement } from 'azoth/runtime';
          import { td41d8cd98f } from 'virtual:azoth-templates?id=d41d8cd98f';
          const c = __createElement(Component, true);
          const cProps = __createElement(Component, { prop: value, attr: "static", }, true);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
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
          "import { __createElement } from 'azoth/runtime';
          import { t06bef50336 } from 'virtual:azoth-templates?id=06bef50336';
          const component = t06bef50336(__createElement(Component, { prop: value, prop2: "literal", }),__createElement(GotNoPropsAsYouCanSee));
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "06bef50336",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { __createElement } from 'azoth/runtime';
          import { td41d8cd98f, t06bef50336 } from 'virtual:azoth-templates?id=d41d8cd98f&id=06bef50336';
          const $A = __createElement(A, true);
          const $B = __createElement(B, true);
          const dom = t06bef50336($A,$B);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "06bef50336",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { __createElement } from 'azoth/runtime';
          import { td41d8cd98f, tc193fcb516, t1cb251ec0d, t047dd60a46 } from 'virtual:azoth-templates?id=d41d8cd98f&id=c193fcb516&id=1cb251ec0d&id=047dd60a46';
          const c = __createElement(Component, null, tc193fcb516("test"), true);
          const cTrim = __createElement(Component, null, tc193fcb516("test"), true);
          const cTrimStart = __createElement(Component, null, tc193fcb516("test"), true);
          const cTrimEnd = __createElement(Component, null, tc193fcb516("test"), true);
          const cText = __createElement(Component, null, t1cb251ec0d(), true);
          const cFrag = __createElement(Component, null, t047dd60a46(1,2), true);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<p><!--0--></p>",
              "id": "c193fcb516",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<p><!--0--></p>",
              "id": "c193fcb516",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<p><!--0--></p>",
              "id": "c193fcb516",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<p><!--0--></p>",
              "id": "c193fcb516",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "text",
              "id": "1cb251ec0d",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "",
              "id": "d41d8cd98f",
              "isDomFragment": false,
              "isEmpty": true,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<p data-bind><!--0--></p>
                          <p data-bind><!--0--></p>",
              "id": "047dd60a46",
              "isDomFragment": true,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { tcb5355f810, t9d84b2deff } from 'virtual:azoth-templates?id=cb5355f810&id=9d84b2deff';

          const Item = name => tcb5355f810(name);
          const Template = () => t9d84b2deff([2, 4, 7].map(Item),"text");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<li><!--0--></li>",
              "id": "cb5355f810",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<div><!--0--><!--0--></div>",
              "id": "9d84b2deff",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
          "import { tcb5355f810, t65cf075bba } from 'virtual:azoth-templates?id=cb5355f810&id=65cf075bba';

          const Emoji = ({name}) => tcb5355f810(name);
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = t65cf075bba(promise);
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "childBindKey": undefined,
              "html": "<li><!--0--></li>",
              "id": "cb5355f810",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
            },
            {
              "childBindKey": undefined,
              "html": "<ul><!--0--></ul>",
              "id": "65cf075bba",
              "isDomFragment": false,
              "isEmpty": false,
              "propBindKey": undefined,
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
            export const CatName = ({ name }) => <li>{name}</li>;
            export const CatNames = cats => <ul>{cats.map(name => <CatName name={name} />)}</ul>;
        `;

        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
            "import { __createElement } from 'azoth/runtime';
            import { t35b2653e5d, tc193fcb516, t65cf075bba, tb4f8dfe3c0, tcb5355f810, td41d8cd98f } from 'virtual:azoth-templates?id=35b2653e5d&id=c193fcb516&id=65cf075bba&id=b4f8dfe3c0&id=cb5355f810&id=d41d8cd98f';
            export const Loading = () => t35b2653e5d();
            export const Cat = ({name}) => tc193fcb516(name);
            export const CatList = cats => t65cf075bba(cats.map(Cat));
            export const CatCount = cats => tb4f8dfe3c0(cats.length);
            export const CatName = ({name}) => tcb5355f810(name);
            export const CatNames = cats => t65cf075bba(cats.map(name => __createElement(CatName, { name: name, }, true)));
            "
        `);
    });

});
