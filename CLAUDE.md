# Azoth — project notes for Claude

## Testing: inline snapshots

Valhalla tests double as **dev examples for LLMs** — the audience is the
model, so optimize for corpus clarity over human editor ergonomics.

- **Let vitest generate snapshot values.** Write
  `expect(html).toMatchInlineSnapshot()` and run `vitest -u`; never
  hand-type the HTML. The snapshot is generated truth from real output.
- **No `/* HTML */` directive.** It only buys editor syntax-highlighting
  for humans — nothing for an LLM, where the value is self-evidently HTML.
  It also triggers a vitest inline-snapshot updater bug (a greedy
  comment-skip coalesces multiple snapshots in one file onto the last on
  `-u`) and churns the call onto two lines. Use plain single-line
  `toMatchInlineSnapshot(`"…"`)`.
- **Keep JSX inline (single-line)** in tests so HTML snapshots don't pick
  up whitespace text nodes between sibling elements.

Background: the greedy-comment-skip bug is fixed upstream by the vitest PR
that came out of this repo's work (`fix(snapshot): make inline comment-skip
regex non-greedy`). Dropping the marker makes our snapshots
regeneration-safe regardless of which vitest version is installed.
