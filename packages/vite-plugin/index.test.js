import { test } from 'vitest';
import plugin from './index.js';

function run(code) {
    const [jsx] = plugin();
    const out = jsx.transform(code, 'test.jsx');
    const { bindings, node, bMap, tMap, boundElements, ...rest } = [...jsx.templates.values()][0];
    const template = {
        bMap: JSON.stringify(bMap),
        tMap: JSON.stringify(tMap),
        ...rest
    };
    // jsx.load()

    return { code: out.code, template };
}

test('basic plugin', ({ expect }) => {
    const { code, template } = run`<div>
        <p title="static" className={status} {...spread}>
            Hello {world}
        </p>
        <Component prop1={prop1} {...obj} option="static">
            <p>{name} slottable!</p>
        </Component>
    </div>`;

    expect(code)
        .toMatchInlineSnapshot(`
          "import { tf89f8a98, tb550bd5b } from 'virtual:azoth-templates?id=f89f8a98&id=b550bd5b';

          tf89f8a98(status,spread,world,[Component, { prop1: prop1, ...obj, option: "static", }, tb550bd5b(name)]);
          "
        `);

    expect(template).toMatchInlineSnapshot(`
      {
        "bMap": "[0,4,1,2]",
        "bindKey": "2cccbf9b",
        "html": "<div>
              <p title="static" data-bind>
                  Hello <!--0-->
              </p>
              <!--0-->
          </div>",
        "id": "f89f8a98",
        "imports": [],
        "isDomFragment": false,
        "isEmpty": false,
        "isStatic": false,
        "propertyNames": [
          "className",
        ],
        "tMap": "[0,0,[0,1],[3]]",
        "targetKey": "88185d12",
      }
    `);
});

test('fragment w/ component', ({ expect }) => {
    const { code, template } = run`<>
        <h1>Hello Sandbox</h1>
        <div>
            <Title />
        </div>
    </>`;

    expect(code).toMatchInlineSnapshot(`
      "import { tafdcadae } from 'virtual:azoth-templates?id=afdcadae';

      tafdcadae([Title]);
      "
    `);

    expect(template).toMatchInlineSnapshot(`
      {
        "bMap": "[2]",
        "bindKey": "dbc1b4c9",
        "html": "<h1>Hello Sandbox</h1>
              <div data-bind>
                  <!--0-->
              </div>",
        "id": "afdcadae",
        "imports": [],
        "isDomFragment": true,
        "isEmpty": false,
        "isStatic": false,
        "propertyNames": null,
        "tMap": "[[0,1]]",
        "targetKey": "6e340b9c",
      }
    `);
});