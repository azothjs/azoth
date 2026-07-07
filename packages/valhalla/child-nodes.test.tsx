/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * CHILDNODES TESTS
 *
 * childNodes is Azoth's mechanism for passing children to components.
 * Unlike React's props.children, it's the second parameter:
 *
 *     const Card = (props, childNodes) => <div>{childNodes}</div>;
 *
 * childNodes is COMPOSED — opaque, fully-resolved DOM delivered as a
 * single Node argument (see the pinned-shape describe below). Compose by
 * nesting; don't try to introspect or manipulate it the way
 * React.Children allows.
 */

import { describe, test } from 'vitest';

function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('childNodes with nested components', () => {

    test('nested components with childNodes and dynamic props', ({ expect }) => {
        const Card = (props, childNodes) => <div class="card">{childNodes}</div>;
        const CardTitle = ({ title }) => <h2 class="card-title">{title}</h2>;

        const StatsCard = ({ title }) => (
            <Card>
                <CardTitle title={title} />
                <div class="stats-content">Content here</div>
            </Card>
        );

        const el = <StatsCard title="Dashboard Stats" />;

        expect(fixture(el)).toMatchInlineSnapshot(`"<div class="card"><h2 class="card-title">Dashboard Stats<!--az:1--></h2><!--az:1-->
                <div class="stats-content">Content here</div><!--az:4--></div>"`);
    });

});

describe('childNodes — the compiled shape (pinned)', () => {

    // The compiler wraps a component's JSX children in their own template;
    // childNodes is that template's rendered DOM — ONE Node argument:
    //   none → undefined · one element → that element · several → a
    //   DocumentFragment · text → fragment(text) · {expr} → fragment of
    //   the composed value + its anchor.
    // Never an array, never a string. This pins the shape jsx.d.ts types
    // (`childNodes?: Node`).

    let received: unknown = 'not called';
    const Inspector = (_props: object, childNodes?: Node) => {
        received = childNodes;
        return <div />;
    };

    // One-line shape descriptor for exact, frozen assertions.
    const shape = (v: unknown): string =>
        v === undefined ? 'undefined'
            : v instanceof DocumentFragment ? `fragment(${v.childNodes.length})`
                : v instanceof Element ? v.tagName
                    : v instanceof Text ? `text(${JSON.stringify(v.data)})`
                        : typeof v;

    test('no children → undefined', ({ expect }) => {
        <Inspector />;
        expect(shape(received)).toBe('undefined');
    });

    test('empty (non-self-closing) → undefined', ({ expect }) => {
        <Inspector></Inspector>;
        expect(shape(received)).toBe('undefined');
    });

    test('one element child → that element', ({ expect }) => {
        <Inspector><p>felix</p></Inspector>;
        expect(shape(received)).toBe('P');
    });

    test('several children → a DocumentFragment', ({ expect }) => {
        <Inspector><p>felix</p><p>duchess</p></Inspector>;
        expect(shape(received)).toBe('fragment(2)');
    });

    test('text child', ({ expect }) => {
        <Inspector>famous cats</Inspector>;
        expect(shape(received)).toBe('fragment(1)');
    });

    test('slot child {expr} → composed DOM (fragment carrying value + anchor)', ({ expect }) => {
        <Inspector>{'felix'}</Inspector>;
        expect(shape(received)).toBe('fragment(2)');
    });

});
