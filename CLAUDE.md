# Azoth — project notes for Claude

## Orientation (cold start, in this order)

1. `docs/design/core-rules.md` — the rule map, one line per rule, file pointers
2. `packages/valhalla/index.md` — **the rules live as tests**; topic → file map
   (its README explains reading `<!--az:N-->` anchors and conventions)
3. `docs/topics/for-llms.md` — repo-work entry. (`packages/azoth/llms.md` is
   the *consumer* guide that ships in the npm package — different audience.)
4. `TODO.md` — open items and deliberate deferrals; `RELEASING.md` — releases

Docs register: informative and tight. Mechanics belong in valhalla tests, not
prose — creating a new `.md` is the exception that needs justification.
`docs/history/` is archive; `docs/design/` is decision records;
`docs/articles/` is outward writing (every article snippet must run in
`valhalla/article-examples.test.tsx`).

## Environment / commands

- If node/pnpm aren't found (non-login shells):
  `export PATH=/opt/homebrew/bin:$HOME/.local/bin:$PATH` — the husky
  pre-commit hook also needs node on PATH or commits fail.
- `pnpm vitest run` — full suite (~3s), includes valhalla in real Chromium
  (playwright). `pnpm --filter valhalla typecheck` (must stay 0 errors).
  `pnpm lint`. dom-info browser-validation is opt-in: `pnpm test:validate`.
- Releases: changesets, fixed version train. Author a changeset with the
  change (`pnpm changeset`); cut with `pnpm version-packages` (NOT
  `pnpm version` — that's a pnpm builtin that shadows the script). Full flow
  in RELEASING.md.

## Testing: inline snapshots — the updater is not trustworthy

Valhalla tests double as **worked examples for LLMs** — optimize for corpus
clarity.

- **Expected values are frozen generated output**: `expect(html).toBe('…')`
  / `expect(seq).toEqual([…])`. Generate the value from a real run — never
  hand-compute it — then freeze.
- **Do not trust the vitest inline-snapshot updater.** `-u` mangles files
  with multiple snapshots, and in **browser mode** the write-back mis-assigns
  even filling one test at a time (values land on the wrong calls). Node-env,
  one-snapshot-per-test fills are the only safe generation path. (Details +
  upstream status: TODO.md "Vitest" items.)
- **Browser-mode regeneration workflow**: probe assertion —
  `expect('SNAP>>>' + JSON.stringify(v)).toBe('')` — run, harvest the
  Received value from the failure output, paste it as the frozen expectation.
- **One assertion per test** where possible; multi-stage tests collect a
  `seq` array asserted once.
- **Keep JSX children single-line** — child whitespace becomes text nodes and
  pollutes HTML expectations. Attribute-position line breaks are safe.
- No `/* HTML */` directives. Test domain: Famous Cats (felix, duchess,
  garfield, tom…).

## Code conventions

- `<!--az:N-->` is a slot anchor (N = nodes the slot owns); `data-bind` marks
  bound elements. The `az:` prefix is a trust boundary — only azoth-minted
  comments carry it.
- Comments state constraints the code can't; the empirical-probe test genre
  (`compose.cascade.test.js`, `compose.clear.test.js`) pins runtime behavior
  before design decisions — extend it rather than arguing from theory.
