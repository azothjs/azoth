# Valhalla - Azoth End-to-End Testing

Browser-based tests verifying Azoth JSX compilation and rendering.

## Setup

Uses Vitest 4+ browser mode with real Chrome via WebDriverIO.

Configuration in root `vite.config.js`:
- `browser.provider: webdriverio()` (factory, not string)
- `browser.name: 'chrome'`

## Test Pattern

```typescript
// Test fixture: clears body, appends node, returns innerHTML
function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

test('element', ({ expect }) => {
    const p = <p>hello</p> as HTMLParagraphElement;
    expect(fixture(p)).toMatchInlineSnapshot(/* HTML */ `"<p>hello</p>"`);
});
```

## Conventions

- Use `/* HTML */` comment for snapshot syntax highlighting
- Type assertions for specific element types: `as HTMLParagraphElement`
- `document.body` as fixture container (universal, always available)
- Inline snapshots keep expected output visible with test code
