/* eslint-disable no-undef */
import { Parser } from 'acorn';
import acornJsx from 'acorn-jsx';
import { azothGenerate as generate } from './index.js';
import { describe, test } from 'vitest';

const JsxParser = Parser.extend(acornJsx());

const parse = code => {
    return JsxParser.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module'
    });
};
const transpile = ast => generate(ast, { indent: '    ' });
const compile = input => {
    return transpile(parse(input));
};

describe('regression', () => {
    test('template literal', ({ expect }) => {
        const input = `\`hello \${place}\``;
        expect(compile(input).code).toMatchInlineSnapshot(`
          "\`hello \${place}\`;
          "
        `);
    });

    test('tagged template literal', ({ expect }) => {
        const input = `const t = tag\`hello \${place}\``;
        expect(compile(input).code).toMatchInlineSnapshot(`
          "const t = tag\`hello \${place}\`;
          "
        `);
    });
});

describe('JSX Dom Literals', () => {
    test('complex template structure with props and child nodes', ({ expect }) => {
        const input = `const t = (<div>
            <p className={"my-class"}>{"felix"}</p>
            <p>static</p>
            <p>{"this is"}<span>{"azoth"}</span></p>
            <ul>
                <li><span>one</span></li>
                <li><span><em>a{"two"}b{"and..."}c</em></span></li>
                <li><span className={"span-class"}>three</span></li>
                {"ul-footer"}
            </ul>
            {"footer"}
        </div>);`;
        const ast = parse(input);
        const { code, stack } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "const t = (() => {
              const { __root, __targets } = makeRenderer();
              const __e0 = __targets[0];
              const __e1 = __targets[1];
              const __e2 = __targets[2];
              const __e3 = __targets[3];
              const __e4 = __targets[4];
              const __e5 = __targets[5];
              const __e6 = __targets[6];
              __e1.className = "my-class";
              __e1.childNodes[0].data = "felix";
              __e2.childNodes[0].data = "this is";
              __e3.childNodes[0].data = "azoth";
              __e5.childNodes[1].data = "two";
              __e5.childNodes[3].data = "and...";
              __e6.className = "span-class";
              __e4.childNodes[7].data = "ul-footer";
              __e0.childNodes[9].data = "footer";
              return __root;
          })();
          "
        `);
    });
});


describe('surrounding code integration mode', () => {
    test('MODE_IIFE (default)', ({ expect }) => {
        const input = `
            const template = <p>{text}</p>;
        `;
        const ast = parse(input);
        const { code, stack } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "const template = (() => {
              const { __root, __targets } = makeRenderer();
              const __e0 = __targets[0];
              __e0.childNodes[0].data = text;
              return __root;
          })();
          "
        `);
    });

    test('ArrowFunctionExpression: implicit return is block', ({ expect }) => {
        const input = `
            const template = (text) => <p>{text}</p>
        `;

        const ast = parse(input);
        const { code, stack } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "const template = text => {
              const { __root, __targets } = makeRenderer();
              const __e0 = __targets[0];
              __e0.childNodes[0].data = text;
              return __root;
          };
          "
        `);
    });


    test('ReturnStatement: injects statements before', ({ expect }) => {
        const input = `
            function template(text) {
                const format = 'text' + '!';
                return <p>{text}</p>;
            }
        `;
        const ast = parse(input);
        const { code, stack } = transpile(ast);
        expect(code).toMatchInlineSnapshot(`
          "function template(text) {
              const format = 'text' + '!';
              const { __root, __targets } = makeRenderer();
              const __e0 = __targets[0];
              __e0.childNodes[0].data = text;
              return __root;
          }
          "
        `);

    });
});