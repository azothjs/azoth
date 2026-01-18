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

## Sandbox: Empirical JSX Testing

`sandbox.test.tsx` is a scratch file for quickly testing Azoth JSX behavior.

**Usage:**
```bash
pnpm test packages/vahalla/sandbox.test.tsx
```

**What it's for:**
- Test JSX patterns and see the DOM output
- Verify interpolation, lists, components
- Debug unexpected rendering behavior
- Quickly verify assumptions

**How to use it:**
1. Open `sandbox.test.tsx`
2. Modify the `scratch` test with your JSX
3. Run the test
4. Inspect the snapshot output

**The primary interface is JSX** — treat it as HTML that returns DOM.

**Deep exploration:** If you need to investigate Azoth internals (maya, thoth), create a sandbox test alongside that specific package. Keep internal exploration separate from developer-facing JSX tests.
