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
            Hello <span>hey {"Azoth"}!</span>
        </p>;`;

        const initial = preParse(input);
        const template = initial.templates[0];
        expect(template.node.type).toBe('JSXElement');

        const { code } = BindGenerator.generate(template);

        expect(code).toMatchInlineSnapshot(`
          "function getTargets(root, targets) {
            const target0 = targets[0];
            const child1 = target0.childNodes[1];
            return [root, child1];
          }

          function apply(p0, p1) {
            const [root, t0, t1] = getTargets();
            t0.className = p0;
            compose(t1, p1);
          }
          "
        `);


    });

});