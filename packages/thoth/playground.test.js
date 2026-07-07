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
          import { t0c2ba934 } from 'virtual:azoth-templates?id=0c2ba934';
          const Greeting = ({name}) => {
              const salutation = name === 'CascadiaJS' ? "Whazzup" : "Hello";
              return t0c2ba934(salutation,name.toUpperCase());
          };
          document.body.append(__createComponent(Greeting, { name: "CascadiaJS", }));
          ==== template 0c2ba934 ====
          html:     <p><!--az:0-->, <!--az:0-->!</p>
          targets:  r => [r.childNodes[0],r.childNodes[2]]
          bind:     (ts) => {
            const t0 = ts[0], t1 = ts[1];
            return (v0, v1) => {
              __compose(t0, v0);
              __compose(t1, v1);
            };    
          }
          renderer: __render("0c2ba934", g356056d3, bac4750db, false)
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
          import { t2ac603a4, te308ce22 } from 'virtual:azoth-templates?id=2ac603a4&id=e308ce22';

          function Page({title, content}) {
              const head = t2ac603a4(title);
              const body = te308ce22(content);
              return [head, body];
          }
          ==== template 2ac603a4 ====
          html:     <header><!--az:0--></header>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("2ac603a4", gdb407f11, b6b86b273, false)
          ==== template e308ce22 ====
          html:     <main><!--az:0--></main>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("e308ce22", gdb407f11, b6b86b273, false)
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
          import { t5a773e88, tf8d26ba0 } from 'virtual:azoth-templates?id=5a773e88&id=f8d26ba0';

          const view = ready ? t5a773e88(content) : tf8d26ba0(pct);
          ==== template 5a773e88 ====
          html:     <section><!--az:0--></section>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("5a773e88", gdb407f11, b6b86b273, false)
          ==== template f8d26ba0 ====
          html:     <p>loading <!--az:0-->%</p>
          targets:  r => [r.childNodes[1]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("f8d26ba0", g043f347c, b6b86b273, false)
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
          import { tafa7221d } from 'virtual:azoth-templates?id=afa7221d';

          const dom = tafa7221d([Cat, { name: name, }]);
          ==== template afa7221d ====
          html:     <div>
                          <!--az:0-->
                      </div>
          targets:  r => [r.childNodes[1]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __composeComponent(t0, v0);
            };    
          }
          renderer: __render("afa7221d", g043f347c, bd4735e3a, false)
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
          import { t2daa7bd4, t2daa7bd4_1 } from 'virtual:azoth-templates?id=2daa7bd4&id=2daa7bd4';

          const a = t2daa7bd4(x);
          const b = t2daa7bd4_1(y);
          ==== template 2daa7bd4 ====
          html:     <p><!--az:0--></p>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("2daa7bd4", gdb407f11, b6b86b273, false)
          ==== template 2daa7bd4 ====
          html:     <p><!--az:0--></p>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("2daa7bd4", gdb407f11, b6b86b273, false)
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
          import { t3d6e97cb, td5d01530 } from 'virtual:azoth-templates?id=3d6e97cb&id=d5d01530';

          const list = t3d6e97cb(items.map(item => td5d01530(item.label)));
          ==== template 3d6e97cb ====
          html:     <ul>
                          <!--az:0-->
                      </ul>
          targets:  r => [r.childNodes[1]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("3d6e97cb", g043f347c, b6b86b273, false)
          ==== template d5d01530 ====
          html:     <li><!--az:0--></li>
          targets:  r => [r.childNodes[0]]
          bind:     (ts) => {
            const t0 = ts[0];
            return (v0) => {
              __compose(t0, v0);
            };    
          }
          renderer: __render("d5d01530", gdb407f11, b6b86b273, false)
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
          import { td6d4856a } from 'virtual:azoth-templates?id=d6d4856a';

          function Component() {
              const name = asyncValueStream();
              return rerenderer(() => td6d4856a(name,salutation));
          }
          ==== template d6d4856a ====
          html:     <p><!--az:0--> <!--az:0-->!</p>
          targets:  r => [r.childNodes[0],r.childNodes[2]]
          bind:     (ts) => {
            const t0 = ts[0], t1 = ts[1];
            return (v0, v1) => {
              __compose(t0, v0);
              __compose(t1, v1);
            };    
          }
          renderer: __render("d6d4856a", g356056d3, bac4750db, false)
          "
        `);
    });

});
