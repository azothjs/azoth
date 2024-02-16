# Hypermedia for the Web

Azoth is a UI/X library for building hypermedia apps on the web platform.

## Hypermedia

Azoth views [Hypermedia](https://en.wikipedia.org/wiki/Hypermedia) through the lens of active web pages that exhibit rich ui content _and_ provide interactivity to enhance and modify the media itself. Unlike state-driven `ui = fn(state)` architectures, in hypermedia apps the active ui _is_ the source of truth:

<pre>
ui<sub>n</sub> = ui<sub>n-1</sub> + Δ
</pre>

The UI is the prior state of the UI plus the delta applied by the last interaction. 

## Timely

For the developer, a hypermedia app provides a clear delineation between what is being rendered right now versus what may need to be added, modified, or removed in the future.

A state-driven app represents the ui as a derivate of state:

```
ui = fn(state)
```

While intended as a DX feature, this paradigm actually introduces complexities and issues not present in hypermedia apps.

## More platform control

Hypermedia empowers you to directly use the web platform. Use any Web API or directly integrate libraries like d3 or GSAP. No wrapper or npm search and pray someone else did.




limits the developer in a number of ways:

State is the source of truth. UI change is done indirectly through state change.

In this paradigm, time is intentionally abstracted away. While intended as a DX feature, it actually limits the developer in a number of ways.



a number of problems

This causes some curious side effects:
- It removes the distinction between initial render and and subsequent updates
- Templates innately lose the ability to distinguish missing data from data that is not yet present


## renders

Time exists explicitly as does the difference between an initial render and an update.

## What about state?



::: info
To be clear, hypermedia apps use data to manage layout and _can_ use state. But there is no _requirement_ to buffer and retain data in memory to produce ui. Use state when needed for unique resources like ui state and temporary user-created data, or to provide an in-memory cache for a remote data source.
:::

## Dispatch

Formalized by flux and popularized by redux, the delineation of updates into discrete actions was one of the biggest innovations in ui architecture of the past decade or so. While some frameworks still offer direct model binding, overall the shift to discrete, defined, actions provides a narrow interface into data management compared to the arbitrary complexity of modifying object graphs.

Dispatch is part and parcel of hypermedia. Each defined event triggers a "scripted interaction" that performs a particular task. However, in hypermedia apps dispatch works from data to ui as well.

## Double Dispatch

















## Two-way Data Binding

The modern JavaScript era really took off around the end of the aughts. The financial crisis of 2008 forced rapid adoption of the cloud for budgetary reasons. Around the same time, node.js was introduced, vastly expanding the scope of what could be accomplished with JavaScript. 

It offered accessible power and opened the door to greater innovation and hacking. After a few years, it crossed over as a build tool for front end applications. Developers had more power (and rope) than ever to dream up frontend architectures.











The web platform has a number of built-in interaction mechanism, for example:

- The HTML code `<a href="/new-content-url">link</a>` defines a user selectable way to load new content media into the window. 
- CSS can be used with [pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) like `:hover` to provide (animated!) presentation changes based on user interaction or layout conditions.
- Form controls provide built-in ways manage user input and even submit the user's input to a url

However, to go beyond the capacity or scope of HTML and CSS built-in interactions, web hypermedia allows events to trigger "scripted" actions. JavaScript has access to very large number of [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) and it can orchestrate a limitless number of interactions:

- The ui () read, write, modify, and subscribe to events of the ui (the media content).
- Internet services via fetch, XHR, WebSockets, WebRTC, WebTransport.
- Access to cameras, microphones, usb devices, geolocation, keyboards, mice, touch, and gamepads (yes, there's an API for that)
- Produce rich experiences with Media, Video, Audio, MIDI, Vibration, Canvas, WebGL
- Crypto, Authentication, Encoding, Decoding
- Animations, View Transitions, Viewport

 defines an action load the content specified by the link. More broadly, DOM events and CSS pseudo-events drive layout and stylistic enhancements we call UX. JavaScript enables interactions to integrate with the web platform. These "scripted" actions can also produce new layout content using services tied to logic to modify the existing layout of the ui. parts. Or an interaction could respond by applying and removing css classes.

At first glance, these qualities might just seem like "part of a web app", however a hypermedia app is fundamentally different than a state-driven app:



