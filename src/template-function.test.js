import { expect, describe, test } from 'vitest';
import './utils/code-matchers.js';
import { compile } from './template-function.js';
import { parse } from './utils/ast.js';
import { simple } from 'acorn-walk';
import { getTemplatesAst } from './utils/get-templates.js';

const _ = () => {};
const isAzoth = node => node.tag?.name === '_';

test('html-only template (no binding)', () => {
    function template() {
        const Greeting = () => _`<span>hello world</span>`;
    }

    const [ast] = getTemplatesAst(template.toCode());
    expect(ast).toMatchSnapshot();

    const code = compile(ast, '__renderer0');

    expect(code).toMatchInlineSnapshot(`
      "() => {
          const __fn = () => {
              return __renderer0().root;
          };
          return __fn
      }"
    `);
});