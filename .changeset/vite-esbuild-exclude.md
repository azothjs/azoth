---
"@azothjs/thoth": patch
---

The Vite plugin now sets `esbuild: { exclude: ['**/*.jsx', '**/*.tsx'] }`
via its `config` hook — Vite's built-in esbuild pipeline never touches
JSX/TSX, so the manual exclude that getting-started configs previously
needed (and the README didn't show) is no longer required.
