# TypeScript Support in Azoth Vite Plugin

## Problem

Thoth's compiler uses Acorn, which parses JavaScript but not TypeScript syntax. Files with `.tsx` extension contain type annotations that Acorn can't parse.

## Solution

Pre-process `.tsx` files with esbuild to strip TypeScript before Thoth compiles JSX:

```javascript
if (id.endsWith('.tsx')) {
    const result = await transform(source, {
        loader: 'tsx',
        jsx: 'preserve',  // Keep JSX for Thoth
    });
    processedSource = result.code;
}
```

## Key Points

- `jsx: 'preserve'` is critical — esbuild must NOT transform JSX
- Only strips type annotations, preserves all JSX syntax
- Extension filter updated to `/\.(jsx|tsx)$/`

## Alternatives Considered

- **@sveltejs/acorn-typescript** (v1.0.7, mid-2025) — Worth revisiting. Supports both TypeScript AND JSX/TSX parsing. Could be a drop-in replacement for Acorn + acorn-jsx in Thoth, eliminating the esbuild pre-processing step entirely. Also supports decorators and `.d.ts` parsing.
- Svelte's recast-based parser — Svelte-specific
- esbuild strip-only approach — chosen for simplicity
