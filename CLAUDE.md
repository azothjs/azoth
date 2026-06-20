# Azoth — project notes for Claude

## Testing: inline snapshots

Valhalla tests double as **dev examples for LLMs** — the audience is the
model, so optimize for corpus clarity over human editor ergonomics.

- **Generate the value, never hand-type it.** Write
  `expect(html).toMatchInlineSnapshot()` and run `vitest -u` — the value is
  generated truth from real output.
- **Then freeze it to `.toBe('…')` for the committed form.** The vitest `-u`
  updater coalesces multiple snapshots in one file (writes several onto one
  call, leaves the others empty) — **NOT fixed in the installed vitest (4.x)**,
  despite the upstream PR; any adjacent `//` comment or a second snapshot can
  trigger it. So generate with `toMatchInlineSnapshot`, then convert each to
  `expect(html).toBe('…')` using the generated string. `.toBe` is immune to the
  `-u` mangling, reads just as clearly, and is exact string equality for an
  `outerHTML` string. (Tradeoff: you lose one-step regeneration — to re-gen,
  temporarily switch back to `toMatchInlineSnapshot`. The real vitest fix is
  deferred.)
- **No `/* HTML */` directive** — nothing for an LLM (the value is self-
  evidently HTML), and it's another `-u` trigger.
- **Keep JSX inline (single-line)** in tests so HTML snapshots don't pick
  up whitespace text nodes between sibling elements.
