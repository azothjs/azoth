/* eslint-disable no-undef */
import { compile as _compile } from './compiler.js';
import { describe, test } from 'vitest';

const compile = input => {
    const { code, templates, map } = _compile(input, {
        generate: { indent: '    ' }
    });
    return {
        code, map,
        templates: templates.map(({ id, html, isDomFragment, isEmpty }) => {
            return { id, html, isDomFragment, isEmpty };
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
          "import { ta516887159 } from 'virtual:azoth-templates?id=a516887159';

          const t = ta516887159("className","Azoth");
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<p>
                      Hello <!--0-->
                  </p>",
              "id": "a516887159",
              "isDomFragment": false,
              "isEmpty": false,
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
          "import { tfdd1a869cf } from 'virtual:azoth-templates?id=fdd1a869cf';

          const t = tfdd1a869cf("my-class","felix","this is","azoth","two","and...","span-class","ul-footer","footer");
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
              "isEmpty": false,
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
          "import { t10073da0ec } from 'virtual:azoth-templates?id=10073da0ec';

          const t = t10073da0ec("className","name","class","class-name");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<input required>",
              "id": "10073da0ec",
              "isDomFragment": false,
              "isEmpty": false,
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
          "import { t8dae88052a, t1a78cbe949 } from 'virtual:azoth-templates?id=8dae88052a&id=1a78cbe949';

          t8dae88052a(t1a78cbe949());
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div><!--0--></div>",
              "id": "8dae88052a",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
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
              "html": "<p>Hello</p>",
              "id": "5bf3d2f523",
              "isDomFragment": false,
              "isEmpty": false,
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
          "import { tc203fe7dcd, tc084de4382 } from 'virtual:azoth-templates?id=c203fe7dcd&id=c084de4382';

          const fragment = tc203fe7dcd();
          const compose = tc084de4382(x);
          const empty = null;
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<hr><hr>",
              "id": "c203fe7dcd",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": true,
              "isEmpty": true,
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
          "import { tc203fe7dcd, t1a78cbe949, tc084de4382, t6c72de769d } from 'virtual:azoth-templates?id=c203fe7dcd&id=1a78cbe949&id=c084de4382&id=6c72de769d';

          const fragment = tc203fe7dcd();
          const single = t1a78cbe949();
          const fragInFrag = t1a78cbe949();
          const fragInFragCompose = tc084de4382(x);
          const empty = null;
          const compose = tc084de4382(x);
          const text = t6c72de769d();
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<hr><hr>",
              "id": "c203fe7dcd",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": true,
              "isEmpty": true,
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "
                          text
                      ",
              "id": "6c72de769d",
              "isDomFragment": true,
              "isEmpty": false,
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
          "import { t1a78cbe949, tc084de4382 } from 'virtual:azoth-templates?id=1a78cbe949&id=c084de4382';

          const start = t1a78cbe949();
          const end = t1a78cbe949();
          const composeStart = tc084de4382(x);
          const composeEnd = tc084de4382(x);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "<hr>",
              "id": "1a78cbe949",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "<!--0-->",
              "id": "c084de4382",
              "isDomFragment": true,
              "isEmpty": false,
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
          "import { t653a3aad80, tdcaa233028, t2dc1738d5c, t0cf31b2c28, t5bc2a159b1 } from 'virtual:azoth-templates?id=653a3aad80&id=dcaa233028&id=2dc1738d5c&id=0cf31b2c28&id=5bc2a159b1';

          const fragment = t653a3aad80();
          const single = tdcaa233028();
          const fragInFrag = t2dc1738d5c();
          const spaces = t0cf31b2c28();
          const compose = t5bc2a159b1(x);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": " <hr><hr> ",
              "id": "653a3aad80",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": " <hr> ",
              "id": "dcaa233028",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "  <hr>  ",
              "id": "2dc1738d5c",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "    ",
              "id": "0cf31b2c28",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": " <!--0--> ",
              "id": "5bc2a159b1",
              "isDomFragment": true,
              "isEmpty": false,
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
          "import { tfaf808e6cc } from 'virtual:azoth-templates?id=faf808e6cc';

          const fragment = tfaf808e6cc("two");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "one<!--0-->three",
              "id": "faf808e6cc",
              "isDomFragment": true,
              "isEmpty": false,
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
          "import { tccaa44c114, t681310be49 } from 'virtual:azoth-templates?id=ccaa44c114&id=681310be49';

          const extraneous = tccaa44c114();
          const childNodeIndex = t681310be49("expect index 3");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<div><hr><hr><hr></div>",
              "id": "ccaa44c114",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "<div>
                          <p></p>
                          <!--0--><p></p>
                          <p></p>
                      </div>",
              "id": "681310be49",
              "isDomFragment": false,
              "isEmpty": false,
            },
          ]
        `);

    });

    test('edge case: <>{...}<el>{...}</el></>', ({ expect }) => {
        const input = `const App = <>{'foo'}<main>{'bar'}</main>{'qux'}</>;`;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { tef691fa27a } from 'virtual:azoth-templates?id=ef691fa27a';

          const App = tef691fa27a('foo','bar','qux');
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<!--0--><main data-bind><!--0--></main><!--0-->",
              "id": "ef691fa27a",
              "isDomFragment": true,
              "isEmpty": false,
            },
          ]
        `);

    });
});

describe('element composition', () => {

    test('custom-element with property', ({ expect }) => {
        const input = `
            document.body.append(<custom-element prop={prop}/>);
        `;
        const { code, templates } = compile(input);

        expect(code).toMatchInlineSnapshot(`
          "import { t1cdf0d646f } from 'virtual:azoth-templates?id=1cdf0d646f';

          document.body.append(t1cdf0d646f(prop));
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<custom-element></custom-element>",
              "id": "1cdf0d646f",
              "isDomFragment": false,
              "isEmpty": false,
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

          const c = __createElement(Component, true);
          const cProps = __createElement(Component, { prop: value, attr: "static", }, true);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
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
          import { t2288998344 } from 'virtual:azoth-templates?id=2288998344';
          const component = t2288998344(__createElement(Component, { prop: value, prop2: "literal", }),__createElement(GotNoPropsAsYouCanSee));
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
              "isEmpty": false,
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
          import { t2288998344 } from 'virtual:azoth-templates?id=2288998344';
          const $A = __createElement(A, true);
          const $B = __createElement(B, true);
          const dom = t2288998344($A,$B);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "<div>
                          <!--0-->
                          <!--0-->
                      </div>",
              "id": "2288998344",
              "isDomFragment": false,
              "isEmpty": false,
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
          import { t904ca237ee, t1cb251ec0d, t9b045328fb } from 'virtual:azoth-templates?id=904ca237ee&id=1cb251ec0d&id=9b045328fb';
          const c = __createElement(Component, null, t904ca237ee("test"), true);
          const cTrim = __createElement(Component, null, t904ca237ee("test"), true);
          const cTrimStart = __createElement(Component, null, t904ca237ee("test"), true);
          const cTrimEnd = __createElement(Component, null, t904ca237ee("test"), true);
          const cText = __createElement(Component, null, t1cb251ec0d(), true);
          const cFrag = __createElement(Component, null, t9b045328fb(1,2), true);
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "<p><!--0--></p>",
              "id": "904ca237ee",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "<p><!--0--></p>",
              "id": "904ca237ee",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "<p><!--0--></p>",
              "id": "904ca237ee",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "<p><!--0--></p>",
              "id": "904ca237ee",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "text",
              "id": "1cb251ec0d",
              "isDomFragment": true,
              "isEmpty": false,
            },
            {
              "html": "",
              "id": "",
              "isDomFragment": false,
              "isEmpty": true,
            },
            {
              "html": "<p data-bind><!--0--></p>
                          <p data-bind><!--0--></p>",
              "id": "9b045328fb",
              "isDomFragment": true,
              "isEmpty": false,
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
          "import { t62831a5152, t8dc93cc914 } from 'virtual:azoth-templates?id=62831a5152&id=8dc93cc914';

          const Item = name => t62831a5152(name);
          const Template = () => t8dc93cc914([2, 4, 7].map(Item),"text");
          "
        `);

        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li><!--0--></li>",
              "id": "62831a5152",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "<div><!--0--><!--0--></div>",
              "id": "8dc93cc914",
              "isDomFragment": false,
              "isEmpty": false,
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
          "import { t62831a5152, t25ec157413 } from 'virtual:azoth-templates?id=62831a5152&id=25ec157413';

          const Emoji = ({name}) => t62831a5152(name);
          const promise = fetchEmojis().then(emojis => emojis.map(Emoji));
          const Emojis = t25ec157413(promise);
          document.body.append(Emojis);
          "
        `);
        expect(templates).toMatchInlineSnapshot(`
          [
            {
              "html": "<li><!--0--></li>",
              "id": "62831a5152",
              "isDomFragment": false,
              "isEmpty": false,
            },
            {
              "html": "<ul><!--0--></ul>",
              "id": "25ec157413",
              "isDomFragment": false,
              "isEmpty": false,
            },
          ]
        `);


    });
});
