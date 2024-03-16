/* eslint-disable no-undef */
import { BindGenerator } from './BindGenerator.js';
import { parse, generate as _generate } from '../compiler.js';
import { describe, test } from 'vitest';

function preParse(input) {
    const ast = parse(input);
    return _generate(ast);
}
describe('Bind Generator', () => {

    test('Hello bind', ({ expect }) => {
        // const input = `const t = <p>yo</p>;`;
        const input = `name => <p>{name}</p>`;
        const initial = preParse(input);
        const template = initial.templates[0];
        expect(template.node.type).toBe('JSXElement');

        const { code } = BindGenerator.generate(template);

        expect(code).toMatchInlineSnapshot(`
          "function targets(r) {
            return [r.childNodes[0]];
          }
          function bind(ts) {
            const t0 = ts[0];
            return (v0) => {
              compose(t0, v0);
            };
          }
          function render(v0) {
            const [root, bind] = makeTemplate(source);
            bind(v0);
            return root;
          }
          "
        `);
    });

    test('Bind children and props', ({ expect }) => {
        // const input = `const t = <p>yo</p>;`;
        const input = `const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`;

        const initial = preParse(input);
        const template = initial.templates[0];
        expect(template.node.type).toBe('JSXElement');

        const { code } = BindGenerator.generate(template);

        expect(code).toMatchInlineSnapshot(`
          "function targets(r, ts) {
            return [r, r.childNodes[1], ts[0].childNodes[1]];
          }
          function bind(ts) {
            const t0 = ts[0], t1 = ts[1], t2 = ts[2];
            return (v0, v1, v2) => {
              t0.className = v0;
              compose(t1, v1);
              compose(t2, v2);
            };
          }
          function render(v0, v1, v2) {
            const [root, bind] = makeTemplate(source);
            bind(v0, v1, v2);
            return root;
          }
          "
        `);
    });
});