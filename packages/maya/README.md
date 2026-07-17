# **Maya** - Azoth Runtime

<img src="https://raw.githubusercontent.com/azothjs/azoth/main/packages/maya/maya.webp" alt="Maya the Azoth Runtime" width="224">

The azoth runtime orchestrates the actualization of the compiled creations of thoth. Invisible and unseen, maya performs the rendering magic in the browser.

Maya is the runtime half of [Azoth](https://github.com/azothjs/azoth) —
JSX for the web platform. Applications usually install the
[`azoth`](https://www.npmjs.com/package/azoth) umbrella package, which
re-exports maya's author surface (`Channel`, `pushable`, `rerenderer`,
keyed lists).

The runtime rules live as tests: the
[valhalla conformance suite](https://github.com/azothjs/azoth/tree/main/packages/valhalla)
runs authored JSX through the compiler and this runtime in a real browser,
freezing verified output.