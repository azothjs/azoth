/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * SLOTTABLE TESTS
 *
 * Slottable is Azoth's mechanism for passing children to components.
 * Unlike React's props.children, it's the second parameter:
 *
 *     const Card = (props, childNodes) => <div>{childNodes}</div>;
 *
 * Slottable is opaque DOM content — compose by nesting, don't try to
 * introspect or manipulate it the way React.Children allows.
 *
 * See docs/topics/components.md for the full mental model.
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
