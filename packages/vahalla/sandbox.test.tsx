/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * AZOTH SANDBOX
 * 
 * A scratch file for empirically testing Azoth JSX behavior.
 * 
 * Usage:
 * 1. Write JSX in the sandbox test
 * 2. Run: pnpm test packages/vahalla/sandbox.test.tsx
 * 3. Inspect the snapshot output
 * 
 * The primary Azoth interface is JSX — treat it as HTML that returns DOM.
 */

import { describe, test } from 'vitest';

// Render helper: clears body, appends content, returns innerHTML
function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('sandbox', () => {

    /**
     * MODIFY THIS TEST to investigate Azoth JSX behavior.
     * 
     * Examples:
     * 
     * // Static elements
     * const el = <div class="card">hello</div>;
     * 
     * // Interpolation
     * const name = "world";
     * const el = <p>hello {name}</p>;
     * 
     * // Lists
     * const items = ["one", "two", "three"];
     * const el = <ul>{items.map(i => <li>{i}</li>)}</ul>;
     * 
     * // Components
     * function Card(props) { return <div class="card">{props.children}</div>; }
     * const el = <Card>content</Card>;
     * 
     * // DOM APIs work immediately
     * const list = <ul><li>a</li><li>b</li></ul>;
     * const items = [...list.children];
     */

    test('scratch', ({ expect }) => {
        // Your JSX here:
        const el = <p>sandbox ready</p>;
        
        expect(fixture(el)).toMatchInlineSnapshot(/* HTML */ `"<p>sandbox ready</p>"`);
    });

});

/**
 * DEEP EXPLORATION
 * 
 * If you need to explore Azoth internals (maya, thoth, etc.),
 * create a sandbox test alongside that specific package:
 * 
 *   packages/maya/sandbox.test.tsx
 *   packages/thoth/sandbox.test.tsx
 * 
 * This keeps internal exploration separate from the developer-facing
 * JSX interface tested here.
 */
