import { describe, test } from 'vitest';
import { compile } from './compiler.js';
import {
    makeTargets,
    makeBind,
    makeRenderer,
} from './transform/template-generators.js';

/**
 * JSX DECOMPOSITION PLAYGROUND
 *
 * A workbench, not a regression suite. Each test takes a JSX scenario and
 * snapshots the full decomposition — the same four panes as the talk
 * slide ("What it compiles to"):
 *
 *   code:     the transformed JS the author's module becomes
 *   html:     the template HTML (delivered in the .html page, by id)
 *   targets:  the generated target-selector function (g…)
 *   bind:     the generated binder (b…) — values in, DOM writes out
 *   renderer: the template factory wiring (t… = __render(…))
 *
 * To reason about a new scenario: add a test with empty snapshots and run
 *
 *   pnpm exec vitest run packages/thoth/playground.test.js -u
 *
 * or keep `vitest playground --watch` open while editing scenarios.
 */

function decompose(input) {
    const { code, templates } = compile(input, {
        generate: { indent: '    ' },
    });

    const sections = [`==== code ====`, code.trim()];
    for(const t of templates) {
        sections.push(
            `==== template ${t.id} ====`,
            `html:     ${t.html}`,
            `targets:  ${makeTargets(t)}`,
            `bind:     ${makeBind(t)}`,
            `renderer: ${makeRenderer(t, { noContent: true })}`,
        );
    }
    return '\n' + sections.join('\n') + '\n';
}

describe('decomposition playground', () => {

    test('talk example — Greeting (two child slots)', ({ expect }) => {
        const input = `
            const Greeting = ({ name }) => {
                const salutation = name === 'CascadiaJS' ? "Whazzup" : "Hello";
                return <p>{salutation}, {name.toUpperCase()}!</p>;
            };
            document.body.append(<Greeting name="CascadiaJS" />);
        `;
        expect(decompose(input)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { __createComponent } from 'azoth/runtime';
          import { t4a104a2a } from 'virtual:azoth-templates?id=4a104a2a';
          const Greeting = ({name}) => {
              const salutation = name === 'CascadiaJS' ? "Whazzup" : "Hello";
              return t4a104a2a(salutation,name.toUpperCase());
          };
          document.body.append(__createComponent(Greeting, { name: "CascadiaJS", }));
          ==== template 4a104a2a ====
          html:     <p><!--0-->, <!--0-->!</p>
          targets:  r => [r.childNodes[0],r.childNodes[2]]
          bind:     (ts) => {
            const t0 = ts[0], t1 = ts[1];
            return (v0, v1) => {
              __compose(t0, v0);
              __compose(t1, v1);
            };    
          }
          renderer: __render("4a104a2a", g356056d3, bac4750db, false)
          ==== template e3b0c442 ====
          html:     
          targets:  null
          bind:     null
          renderer: null
          "
        `);
    });

    test('property binding — className compiles; class={…} is a compile error', ({ expect }) => {
        // The dynamic channel (`={…}`) writes the DOM property. `className` is
        // the real property name, so it compiles straight through.
        expect(decompose(`const a = <p className={status}>ok</p>;`)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { t0095e1b8 } from 'virtual:azoth-templates?id=0095e1b8';

          const a = t0095e1b8(status);
          ==== template 0095e1b8 ====
          html:     <p>ok</p>
          targets:  r => [r]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              t0.className = v0;
            };    
          }
          renderer: __render("0095e1b8", gd124b23c, bc38a3225, false)
          "
        `);

        // `class={…}` used to silently write a non-existent `class` JS property
        // — the invisible foot-gun. dom-info now rejects it at compile time and
        // points at the property name.
        expect(() => compile(`const b = <p class={status}>broken</p>;`))
            .toThrowError(/use the DOM property name "className"/);
    });

    test('static attributes — markup, errors, and NON_STATIC promotion', ({ expect }) => {
        // A static attribute is markup and stays in the template HTML. But
        // NON_STATIC names (autofocus, muted, …) can't survive being cloned
        // from a <template>, so they promote to a runtime property assignment
        // and drop out of the HTML — `required` stays, `autofocus` becomes a
        // binding.
        expect(decompose(`const t = <input autofocus required name={n} />;`)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { t9ca71c1d } from 'virtual:azoth-templates?id=9ca71c1d';

          const t = t9ca71c1d(true,n);
          ==== template 9ca71c1d ====
          html:     <input required>
          targets:  r => [r,r]
          bind:     (ts) => {
            const t0 = ts[0], t1 = ts[1];
            return (v0, v1) => {
              t0.autofocus = v0;
              t1.name = v1;
            };    
          }
          renderer: __render("9ca71c1d", ga95fa6bb, b90264fbb, false)
          "
        `);

        // Static channel mismatches are compile errors, not silent markup:
        expect(() => compile(`const t = <p className="x">y</p>;`))
            .toThrowError(/use the HTML attribute "class"/);
        expect(() => compile(`const t = <button onclick="f()">b</button>;`))
            .toThrowError(/Event handlers are dynamic/);
        expect(() => compile(`const t = <div href="/x">d</div>;`))
            .toThrowError(/"href" is not a valid attribute on <div>/);
    });

    test('unknown tags error; HTML/SVG/MathML and custom elements compile', ({ expect }) => {
        // A lowercase, non-hyphen tag must be a known platform element.
        expect(() => compile(`const t = <foo>x</foo>;`))
            .toThrowError(/<foo> is not a known HTML, SVG, or MathML element/);
        // Known platform elements (incl. SVG) and custom elements are fine.
        expect(() => compile(`const t = <svg><circle/></svg>;`)).not.toThrow();
        expect(() => compile(`const t = <my-widget>x</my-widget>;`)).not.toThrow();
    });

    test('multi-fragment function — two templates, one function', ({ expect }) => {
        const input = `
            function Page({ title, content }) {
                const head = <header>{title}</header>;
                const body = <main>{content}</main>;
                return [head, body];
            }
        `;
        expect(decompose(input)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { t9a2e4cdb, t732d1cd1 } from 'virtual:azoth-templates?id=9a2e4cdb&id=732d1cd1';

          function Page({title, content}) {
              const head = t9a2e4cdb(title);
              const body = t732d1cd1(content);
              return [head, body];
          }
          ==== template 9a2e4cdb ====
          html:     <header><!--0--></header>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("9a2e4cdb", gdb407f11, b6b86b273, false)
          ==== template 732d1cd1 ====
          html:     <main><!--0--></main>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("732d1cd1", gdb407f11, b6b86b273, false)
          "
        `);
    });

    test('conditional — each branch is its own template', ({ expect }) => {
        const input = `
            const view = ready
                ? <section>{content}</section>
                : <p>loading {pct}%</p>;
        `;
        expect(decompose(input)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { tf4127425, t79ccc8b8 } from 'virtual:azoth-templates?id=f4127425&id=79ccc8b8';

          const view = ready ? tf4127425(content) : t79ccc8b8(pct);
          ==== template f4127425 ====
          html:     <section><!--0--></section>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("f4127425", gdb407f11, b6b86b273, false)
          ==== template 79ccc8b8 ====
          html:     <p>loading <!--0-->%</p>
          targets:  r => [r.childNodes[1]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("79ccc8b8", g043f347c, b6b86b273, false)
          "
        `);
    });

    test('nested component in element', ({ expect }) => {
        const input = `
            const dom = <div>
                <Cat name={name}/>
            </div>;
        `;
        expect(decompose(input)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { t3d3e41e0 } from 'virtual:azoth-templates?id=3d3e41e0';

          const dom = t3d3e41e0([Cat, { name: name, }]);
          ==== template 3d3e41e0 ====
          html:     <div>
                          <!--0-->
                      </div>
          targets:  r => [r.childNodes[1]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __composeComponent(t0, v0);
            };    
          }
          renderer: __render("3d3e41e0", g043f347c, bd4735e3a, false)
          "
        `);
    });

    test('dedupe — identical templates share one id (the rerender key collision)', ({ expect }) => {
        const input = `
            const a = <p>{x}</p>;
            const b = <p>{y}</p>;
        `;
        expect(decompose(input)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { t15aa2705, t15aa2705_1 } from 'virtual:azoth-templates?id=15aa2705&id=15aa2705';

          const a = t15aa2705(x);
          const b = t15aa2705_1(y);
          ==== template 15aa2705 ====
          html:     <p><!--0--></p>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("15aa2705", gdb407f11, b6b86b273, false)
          ==== template 15aa2705 ====
          html:     <p><!--0--></p>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("15aa2705", gdb407f11, b6b86b273, false)
          "
        `);
    });

    test('list map — template factory inside a callback', ({ expect }) => {
        const input = `
            const list = <ul>
                {items.map(item => <li>{item.label}</li>)}
            </ul>;
        `;
        expect(decompose(input)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { t057b50eb, tfbb7e8b4 } from 'virtual:azoth-templates?id=057b50eb&id=fbb7e8b4';

          const list = t057b50eb(items.map(item => tfbb7e8b4(item.label)));
          ==== template 057b50eb ====
          html:     <ul>
                          <!--0-->
                      </ul>
          targets:  r => [r.childNodes[1]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("057b50eb", g043f347c, b6b86b273, false)
          ==== template fbb7e8b4 ====
          html:     <li><!--0--></li>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("fbb7e8b4", gdb407f11, b6b86b273, false)
          "
        `);
    });

    test('narrow-scope convention — component returns rerenderer(thunk)', ({ expect }) => {
        const input = `
            function Component() {
                const name = asyncValueStream();
                return rerenderer(() => <p>{name} {salutation}!</p>);
            }
        `;
        expect(decompose(input)).toMatchInlineSnapshot(`
          "
          ==== code ====
          import { t47556cd8 } from 'virtual:azoth-templates?id=47556cd8';

          function Component() {
              const name = asyncValueStream();
              return rerenderer(() => t47556cd8(name,salutation));
          }
          ==== template 47556cd8 ====
          html:     <p><!--0--> <!--0-->!</p>
          targets:  r => [r.childNodes[0],r.childNodes[2]]
          bind:     (ts) => {
            const t0 = ts[0], t1 = ts[1];
            return (v0, v1) => {
              __compose(t0, v0);
              __compose(t1, v1);
            };    
          }
          renderer: __render("47556cd8", g356056d3, bac4750db, false)
          "
        `);
    });

});
