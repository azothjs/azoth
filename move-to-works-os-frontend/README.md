# Move to works-os-frontend

App-level conventions and methodology that grew up inside the works
dashboard project and were parked in azoth's docs. They are not azoth
documentation — they describe how ONE application team works — and they
belong in the works-os-frontend repo.

- `workflow.md` — the UI-first build methodology (phases, View/CardView,
  mode shifts, step-size discipline). Azoth-flavored throughout, but the
  process and the examples (AgentSearch, dashboards) are the app's.
- `authoring-style.md` — file naming, data-ownership, `$`-suffix
  conventions. Team style, not framework rules.

Anything azoth-general in these files already lives elsewhere (whitespace
rules → valhalla README; the stream+channel pattern → workflow's section
was rewritten against current APIs before the move and can be lifted into
works-os docs as-is). Delete this folder once the files land over there.
