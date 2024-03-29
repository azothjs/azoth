import { test } from 'vitest';
import plugin from './index.js';

const [jsx] = plugin();

test('basic plugin', ({ expect }) => {
    const code = `<p className={status}>Hello {world}</p>`;
    const out = jsx.transform(code, 'test.jsx');
    expect(out.code)
        .toMatchInlineSnapshot(`
          "import { t99f5a7f5 } from 'virtual:azoth-templates?id=99f5a7f5';

          t99f5a7f5(status,world);
          "
        `);
    const { bindings, node, bMap, tMap, boundElements, ...rest } = [...jsx.templates.values()][0];
    expect(rest).toMatchInlineSnapshot(`
      {
        "bindKey": "[0,1]",
        "html": "<p>Hello <!--0--></p>",
        "id": "99f5a7f5",
        "imports": [],
        "isDomFragment": false,
        "isEmpty": false,
        "isStatic": false,
        "propertyNames": [
          "className",
        ],
        "targetKey": "[-1,[1]]",
      }
    `);
});