/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * COMPONENT TESTS
 * 
 * Tests for Azoth component patterns, especially where they differ from React.
 */

import { describe, test } from 'vitest';
import { Card as ImportedCard, CardTitle as ImportedCardTitle } from './Card.tsx';

// Render helper: clears body, appends node, returns innerHTML
function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('slottable with nested components', () => {

    test('wre-dashboards pattern: wrapper with Card + CardTitle + content', ({ expect }) => {
        // Matches actual wre-dashboards pattern:
        // - Card and CardTitle imported from separate file
        // - Used inside a wrapper component (like ZillowStats)
        // - Card contains CardTitle PLUS additional content (div)
        
        const StatsCard = () => (
            <ImportedCard>
                <ImportedCardTitle title="My Title" />
                <div class="stats-content">Some content here</div>
            </ImportedCard>
        );
        
        const el = <StatsCard />;
        
        // WORKS in Valhalla - still can't reproduce wre-dashboards crash
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<div class="card"><h2 class="card-title">My Title<!--1--></h2><div class="stats-content">Some content here</div><!--1--></div>"`
        );
    });

});

describe('dynamic class attributes', () => {

    test('class={var} does NOT work - uses attribute name not property name', ({ expect }) => {
        // This demonstrates the known limitation: dynamic bindings need DOM property names
        const Box = ({ class: className }) => (
            <div class={className}>content</div>
        );
        
        const el = <Box class="highlighted" />;
        
        // BUG: class attribute missing because element["class"] doesn't work
        expect(fixture(el)).toMatchInlineSnapshot(/* HTML */ `"<div>content</div>"`);
    });

    test('className={var} DOES work - uses DOM property name', ({ expect }) => {
        // Correct approach: use className for dynamic class bindings
        const Box = ({ className }) => (
            <div className={className}>content</div>
        );
        
        const el = <Box className="highlighted" />;
        
        // Works because element.className = value
        expect(fixture(el)).toMatchInlineSnapshot(/* HTML */ `
      "<div class="card"><h2 class="card-title">My Title<!--1--></h2><!--1-->
                      <div class="stats-content">Some content here</div><!--1--></div>"
    `);
    });

});
