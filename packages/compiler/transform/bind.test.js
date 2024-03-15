/* eslint-disable no-undef */
import { BindGenerator } from './BlindGenerator.js';
import { parse, generate as _generate } from '../compiler.js';
import { describe, test } from 'vitest';

function preParse(input) {
    const ast = parse(input);
    return _generate(ast);
}
describe('Bind Generator', () => {

    test('Hello Bind', ({ expect }) => {
        // const input = `const t = <p>yo</p>;`;
        const input = `const t = <p className={"className"}>
            {"Greeting"} <span>hey {"Azoth"}!</span>
        </p>;`;

        const initial = preParse(input);
        const template = initial.templates[0];
        expect(template.node.type).toBe('JSXElement');

        const { code } = BindGenerator.generate(template);

        expect(code).toMatchInlineSnapshot(`
          "function getTargets(r, [t0]) {
            return [r, r.childNodes[1], t0.childNodes[1]];
          }

          function apply(p0, p1, p2) {
            const [root, t0, t1, t2] = getTargets();
            t0.className = p0;
            compose(t1, p1);
            compose(t2, p2);
          }
          "
        `);
    });

    test('Hello Bind', ({ expect }) => {
        // const input = `const t = <p>yo</p>;`;
        const input = `name => <p>{name}</p>`;
        const initial = preParse(input);
        const template = initial.templates[0];
        expect(template.node.type).toBe('JSXElement');

        const { code } = BindGenerator.generate(template);

        expect(code).toMatchInlineSnapshot(`
          "function getTargets(r) {
            return [r.childNodes[0]];
          }

          function apply(p0) {
            const [root, t0] = getTargets();
            compose(t0, p0);
          }
          "
        `);


    });

});