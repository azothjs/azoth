/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
import { describe, test } from 'vitest';

// Test fixture: clears body, appends node, returns innerHTML
function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('azoth tsx', () => {

    // Azoth JSX produces DOM literals, not virtual DOM
    // <p> yields an actual HTMLParagraphElement, not a React component
    test('paragraph element', ({ expect }) => {
        const paragraph = <p>hello azoth</p> as HTMLParagraphElement;

        expect(fixture(paragraph)).toMatchInlineSnapshot(/* HTML */ `"<p>hello azoth</p>"`);
    });

    // DOM literals work with all standard DOM APIs
    // Spread children, querySelectorAll, classList, etc.
    test('DOM APIs work on JSX output', ({ expect }) => {
        const list = <ul>
            <li class="cat">felix</li>
            <li class="cat">stimpy</li>
            <li class="dog">spike</li>
        </ul> as HTMLUListElement;

        // Spread children into an array
        const items = [...list.children];
        expect(items.length).toBe(3);

        // querySelectorAll returns NodeList, destructure it
        const [felix, stimpy] = list.querySelectorAll('.cat');
        expect(felix.textContent).toBe('felix');
        expect(stimpy.textContent).toBe('stimpy');

        // Standard DOM manipulation
        felix.classList.add('cartoon');
        expect(felix.className).toBe('cat cartoon');
    });

});
