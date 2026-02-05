# Vahalla - Azoth End-to-End Testing

Browser-based tests verifying Azoth JSX compilation and rendering at the API level.

## Purpose

Vahalla tests the **developer-facing JSX interface** — treating JSX as HTML that returns DOM. This is distinct from:

- **vite-test/**: A minimal Vite bootstrap project that verifies Azoth works correctly in a standard Vite build environment. Use for build system integration testing.
- **packages/thoth/compiler.test.js**: Compiler-level tests for the Thoth transpiler. Use for testing compilation output.

**When to add tests here:**
- Testing component patterns (props, slottable, nesting)
- Verifying JSX-to-DOM behavior
- Documenting idiomatic Azoth patterns
- Investigating rendering bugs at the API level
- Capturing Azoth-specific behaviors that differ from React

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
    const p = <p>hello</p>;
    expect(fixture(p)).toMatchInlineSnapshot(/* HTML */ `"<p>hello</p>"`);
});
```

## Conventions

- **Use `/* HTML */` comment** before inline snapshots for syntax highlighting
- `document.body` as fixture container (universal, always available)
- Inline snapshots keep expected output visible with test code

## TypeScript and DOM Types

Azoth JSX returns actual DOM elements, but TypeScript types them as generic `Node`. This works fine for composition—nesting components, appending to DOM, etc.

### When to Use Type Assertions

Use `as` assertions when you need to interact with the element via DOM APIs:

```typescript
// Composition - no assertion needed, Node is sufficient
const page = (
    <main>
        <Card title="Stats"><StatValue value={42} /></Card>
    </main>
);

// DOM manipulation - assert to access specific properties
const input = <input type="text" /> as HTMLInputElement;
input.focus();      // TypeScript knows .focus() exists
input.value = 'hi'; // And .value
```

### Component Authors

It doesn't hurt to annotate components with their actual return type. This is most useful when the component will be interacted with via DOM APIs:

```typescript
// Video player - consumers likely need HTMLVideoElement properties
const VideoPlayer = ({ src }) => (
    <video src={src} controls />
) as HTMLVideoElement;

// Simple display component - Node is fine, no annotation needed
const Greeting = ({ name }) => <p>Hello, {name}</p>;
```

If consumers will use your component as a specific DOM element (video player, canvas, form inputs), annotating helps. For pure display components, the generic `Node` type works and avoids ceremony.

### TypeScript Doesn't Enforce HTML Content Models

Note: TypeScript does not validate semantic HTML nesting. You can put `<div>` inside `<p>` without type errors (though browsers will fix the invalid nesting at runtime).

### Running Type Checks

```bash
# From vahalla package
pnpm typecheck

# From workspace root
./node_modules/.bin/tsc -p packages/vahalla/tsconfig.json
```

### Configuration

`tsconfig.json` extends the root config with test-friendly settings:
- `noImplicitAny: false` - allows flexible test signatures
- `allowImportingTsExtensions: true` - supports `.tsx` imports

For intentional type violations (like testing runtime behavior of missing args), use `// @ts-expect-error` with a comment explaining why.

## Test Files

### smoke.test.tsx
Core JSX-to-DOM behavior. Verifies the fundamental principle: JSX produces DOM elements.
- Static elements
- DOM APIs work on JSX output

### components.test.tsx
Comprehensive component pattern tests. Documents Azoth-specific behaviors:

| Section | What it tests |
|---------|---------------|
| **Slottable with nested components** | How children are passed to components |
| **Dynamic class attributes** | `class={var}` vs `className={var}` behavior |
| **Component invocation** | `<Component/>` vs `Component()` props behavior |
| **Element binding positions** | Root vs child element bindings |

**Key documented behaviors:**
- `<Component />` passes `{}` (empty object, enables destructuring)
- `<Component foo={bar}/>` passes `{ foo: bar }`
- `Component()` direct call passes `undefined`
- `class={var}` doesn't work (use `className={var}`)
- Root vs child element bindings produce different template structures

### sandbox.test.tsx
Scratch file for quick experiments. Not for permanent tests.

## Running Tests

```bash
# Run all Vahalla tests
pnpm test packages/vahalla/

# Run specific test file
pnpm test packages/vahalla/components.test.tsx

# Update snapshots
pnpm test packages/vahalla/components.test.tsx -- -u

# TypeScript check
pnpm --filter valhalla typecheck
```

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
- Quickly verify assumptions before codifying

**How to use it:**
1. Open `sandbox.test.tsx`
2. Modify the `scratch` test with your JSX
3. Run the test
4. Inspect the snapshot output

**The primary interface is JSX** — treat it as HTML that returns DOM.

**Deep exploration:** If you need to investigate Azoth internals (maya, thoth), create a sandbox test alongside that specific package. Keep internal exploration separate from developer-facing JSX tests.

## Adding New Tests

When you discover Azoth behavior worth documenting:

1. **Verify empirically** in sandbox.test.tsx first
2. **Create permanent test** in components.test.tsx with explanatory comments
3. **Update this README** if it's a major behavior category
4. Consider cross-referencing compiler-level tests in thoth if relevant
