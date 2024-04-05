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
          "import { t92e0405b, tcc6d7af4 } from 'virtual:azoth-templates?id=92e0405b&id=cc6d7af4';

          t92e0405b(status,spread,world,[Component, { prop1: prop1, ...obj, option: "static", }, tcc6d7af4(name)]);
          "
        `);

    expect(template).toMatchInlineSnapshot(`
      {
        "bMap": "[0,4,1,2]",
        "bindKey": "8ba55e59",
        "html": "<div>
              <p title="static" data-bind>
                  Hello <!--0-->
              </p>
              <!--0-->
          </div>",
        "id": "92e0405b",
        "imports": [],
        "isDomFragment": false,
        "isEmpty": false,
        "isStatic": false,
        "propertyNames": [
          "className",
        ],
        "tMap": "[0,0,[0,1],[3]]",
        "targetKey": "deb2f2b5",
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
      "import { t914853a3 } from 'virtual:azoth-templates?id=914853a3';

      t914853a3([Title]);
      "
    `);

    expect(template).toMatchInlineSnapshot(`
      {
        "bMap": "[2]",
        "bindKey": "d4735e3a",
        "html": "<h1>Hello Sandbox</h1>
              <div data-bind>
                  <!--0-->
              </div>",
        "id": "914853a3",
        "imports": [],
        "isDomFragment": true,
        "isEmpty": false,
        "isStatic": false,
        "propertyNames": null,
        "tMap": "[[0,1]]",
        "targetKey": "83b97b85",
      }
    `);
});