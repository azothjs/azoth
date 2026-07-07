/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * COMPONENT FORMS
 *
 * Component = constructor. It runs ONCE, at JSX-evaluation time, and hands
 * back DOM. After that the DOM is what changes — the component doesn't run
 * again. The constructible forms (packages/maya/compose/compose.js create()):
 *
 *   arrow            called (props, childNodes)
 *   class            new C(props, childNodes), then render()
 *   function(){}     new'd too (has .prototype.constructor)
 *   object           { initialize?, render, update } — initialize is the
 *                    literal's constructor moment
 *   null/undefined   renders nothing (the conditional pattern)
 *
 * A component may also return a FUNCTION — the chain rule calls it until
 * something composable comes out. Everything else in component position
 * throws with a pointed message (primitives, Nodes — those are VALUES:
 * interpolate {x}, don't invoke <X/>).
 *
 * Under a rerenderer, the change channel is update(props, childNodes) —
 * same Constructor at a slot updates the live instance in place (see
 * rerenderer.test.tsx for the flow rules).
 *
 * Invocation/props semantics: component-invocation.test.tsx. childNodes
 * shape: child-nodes.test.tsx. Expected values are frozen generated
 * output (see README.md).
 */

import { describe, test } from 'vitest';
import { rerenderer } from '@azothjs/maya/renderer';

function fixture(): HTMLElement {
    document.body.innerHTML = '';
    return document.body;
}

describe('function components', () => {

    test('runs once; locals are just closures — no hooks', ({ expect }) => {
        // The component builds DOM once. The event handler mutates it
        // directly through the closure. No useState, no re-run.
        const Counter = () => {
            let n = 0;
            const label = <span>{n}</span> as HTMLSpanElement;
            return <button onclick={() => { n++; label.textContent = `${n}`; }}>{label}</button>;
        };
        const root = fixture();
        root.append(<Counter />);

        const button = root.querySelector('button')!;
        expect(button.textContent).toBe('0');
        button.click();
        button.click();
        expect(button.textContent).toBe('2');
    });

    test('returning null renders nothing', ({ expect }) => {
        const Maybe = ({ show }: { show: boolean }) => show ? <em>here</em> : null;
        const root = fixture();
        root.append(<main><Maybe show={true} /><Maybe show={false} /></main>);

        expect(root.innerHTML).toBe('<main><em>here</em><!--az:1--><!--az:0--></main>');
    });

    test('null in component position renders nothing (conditional component)', ({ expect }) => {
        const Cat = () => <p>felix</p>;
        // Cast: TS can't tag a nullable union (TS2604) even though
        // JSX.ElementType includes null — typing-pass finding, see TODO.
        const C = (Math.hypot(3, 4) === 5 ? null : Cat) as any;   // runtime-opaque null
        const root = fixture();
        root.append(<main><C /></main>);

        expect(root.innerHTML).toBe('<main><!--az:0--></main>');
    });

});

describe('class components — component = constructor, literally', () => {

    test('an instance is a value: compose drives render(); methods mutate its DOM', ({ expect }) => {
        // Encapsulated state with methods that mutate DOM — the platform
        // construct for that is a class. Not useReducer. A class.
        class GuestBook {
            list = (<ul />) as HTMLUListElement;
            el: Node;
            constructor({ title }: { title: string }) {
                this.el = <section><h2>{title}</h2>{this.list}</section>;
            }
            render() { return this.el; }
            sign(name: string) { this.list.append(<li>{name}</li>); }
        }

        const book = new GuestBook({ title: 'visitors' });
        const root = fixture();
        root.append(<main>{book}</main>);
        book.sign('felix');
        book.sign('duchess');

        expect(root.innerHTML).toBe('<main><section><h2 data-bind="">visitors<!--az:1--></h2><ul><li>felix<!--az:1--></li><li>duchess<!--az:1--></li></ul><!--az:1--></section><!--az:1--></main>');
    });

    test('childNodes arrive as the constructor second argument', ({ expect }) => {
        class Frame {
            el: Node;
            // props left untyped: with a narrow props type, TS synthesizes
            // `children` INTO props for checking — but azoth delivers
            // children as the second arg, never in props. Typing-pass
            // finding (ElementChildrenAttribute vs arg-2), see TODO.
            constructor({ label }: any, childNodes?: Node) {
                this.el = <fieldset><legend>{label}</legend>{childNodes}</fieldset>;
            }
            render() { return this.el; }
        }
        const root = fixture();
        root.append(<main><Frame label="pets"><p>felix</p></Frame></main>);

        expect(root.innerHTML).toBe('<main><fieldset><legend data-bind="">pets<!--az:1--></legend><p>felix</p><!--az:1--></fieldset><!--az:1--></main>');
    });

});

describe('created vs composed — where the JSX sits decides', () => {

    // Marty's split: a component at the TOP LEVEL of a JSX expression is
    // CREATED only — the instance is the value you hold. Embedded in JSX,
    // it's created AND composed — fully resolved into DOM at its anchor.
    test('top-level JSX returns the created instance itself', ({ expect }) => {
        class Cat {
            name = 'felix';
            el = <p>felix</p>;
            render() { return this.el; }
        }
        // Typing gap: JSX.Element = Node, so holding the instance needs the
        // cast — the per-form typing pass (TODO) is where this gets typed.
        const cat = (<Cat />) as unknown as Cat;

        expect(cat).toBeInstanceOf(Cat);
        expect(cat.name).toBe('felix');

        const root = fixture();
        root.append(<main>{cat}</main>);           // composing it resolves render()
        expect(root.innerHTML).toBe('<main><p>felix</p><!--az:1--></main>');
    });

});

describe('object components — initialize is the constructor moment', () => {

    test('object with { initialize, render, update }: intake, then DOM', ({ expect }) => {
        const badge = {
            el: null as Node | null,
            initialize(props: { label: string }) { this.el = <em>{props.label}</em>; },
            render() { return this.el; },
            update() { },
        };
        // Cast: TS's JSX tag checking wants a call/construct signature and
        // won't take an object value as a tag (TS2604), though runtime
        // create() drives it via initialize/render. Typing-pass finding.
        const Badge = badge as any;
        const root = fixture();
        root.append(<main><Badge label="famous" /></main>);

        expect(root.innerHTML).toBe('<main><em>famous<!--az:1--></em><!--az:1--></main>');
    });

});

describe('the chain rule', () => {

    test('a component returning a function is called until something composable comes out', ({ expect }) => {
        const Lazy = ({ name }: { name: string }) => () => <p>hi {name}</p>;
        const root = fixture();
        root.append(<main><Lazy name="felix" /></main>);

        expect(root.innerHTML).toBe('<main><p>hi felix<!--az:1--></p><!--az:1--></main>');
    });

});

describe('the update verb — same Constructor under a rerenderer', () => {

    test('update(props) adapts the live instance in place: constructor once, same DOM', ({ expect }) => {
        let constructed = 0;
        class Badge {
            #label = document.createTextNode('');
            #el = (<em>{this.#label}</em>) as HTMLElement;
            constructor({ label }: { label: string }) {
                constructed++;
                this.#label.data = label;
            }
            render() { return this.#el; }
            update({ label }: { label: string }) { this.#label.data = label; }  // adapt in place → void
        }
        const page = rerenderer((label: string) => <p>status: <Badge label={label} /></p>);

        const p = page('new') as HTMLParagraphElement;
        const em = p.querySelector('em');
        expect(constructed).toBe(1);
        expect(em!.textContent).toBe('new');

        page('hot');
        expect(constructed).toBe(1);              // constructor did NOT re-run
        expect(p.querySelector('em')).toBe(em);   // same element, adapted
        expect(em!.textContent).toBe('hot');
    });

});

describe('rejections — pointed errors for non-constructible things', () => {

    test('a primitive in component position throws toward interpolation', ({ expect }) => {
        const C = 'felix' as any;
        expect(() => <main><C /></main>).toThrow(/Cannot use string/);
        expect(() => <main><C /></main>).toThrow(/interpolate it directly: \{value\}/);
    });

    test('a DOM Node in component position throws — a pre-built Node is a value', ({ expect }) => {
        const N = (<div />) as any;
        expect(() => <main><N /></main>).toThrow(/Cannot use a DOM Node as a component/);
        expect(() => <main><N /></main>).toThrow(/\{node\} rather than <Node\/>/);
    });

    test('an object without render() throws with the hint', ({ expect }) => {
        const C = { label: 'felix' } as any;
        expect(() => <main><C /></main>).toThrow(/Did you mean to include a "render" method\?/);
    });

});
