---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Azoth"
#   text: "Familiar Syntax, Infinite Possibilities"
  tagline: "Hypermedia UI/X Library for the Web Platform"
#   tagline: The web is fun again
  actions:
    - theme: brand
      text: What is Azoth?
      link: /about
    - theme: alt
      text: Use it
      link: /use-it
    - theme: alt
      text: Docs
      link: /docs

features:
  - title: The Web is the API
    details: JSX is DOM. Use any Web Standard API and all of JavaScript without having to wrap or reinterpret like with vdom and state-driven paradigms
  - title: Consistent with JavaScript
    details: No idiosyncrasies, anomalies, or other weird compiler limitations. Literal DOM types plus composition with standard synchronous and asynchronous JavaScript
  - title: More Developer Control
    details: Compiles to self-rendering code without any controlling framework. No black box and no abstraction to think through.
  - title: Code How You Like
    details: "Pick the right tool for the context, not what your framework needs: imperative, declarative, functional, object-oriented, stateful, immutable."
  - title: Any asynchronous provider
    details: Use existing solutions like RxJS, MobX, and Apollo client - or don't. Promises, observables, signals, streams, async generators - any async JavaScript data structure can be used.
  - title: State management is optional
    details: Yep. You don't need to buffer everything into memory just to puppeteer the UI. You can maintain state when needed, but it's not an essential part of the UI.
  - title: Hyper-optimized compilation
    details: Fast and small in both time and space. JSX is deconstructed into HTML processed by the browser and the minimal required JS execution code.
---
