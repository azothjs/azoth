# Azoth JSX Type Definitions

## Architecture

TypeScript's JSX type system has two mappings:
- `IntrinsicElements` → props validation per tag (works great)
- `Element` → single return type for ALL JSX expressions

## Current Implementation

`jsx.d.ts` defines:
- `JSX.Element = Node` — covers elements, fragments, text
- `IntrinsicElements` maps tags to `IntrinsicElementProps<HTMLElementType>`

## Type Assertion Pattern

Since TypeScript can't infer per-tag return types:

```typescript
const p = <p>hello</p> as HTMLParagraphElement;
```

This is type-safe because Azoth JSX literally creates that element type at runtime.

## Known Limitation

No `JSX.IntrinsicElementReturnTypes` exists in TypeScript. The return type cannot vary by tag name. Potential future TypeScript contribution.

## Gotchas

- Don't create both `jsx.d.ts` (global namespace) and `jsx-runtime.d.ts` (export namespace) — they conflict
- IDE may cache stale types; restart TS server after changes
