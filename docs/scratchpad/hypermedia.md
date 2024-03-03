# Web Architecture with Hypermedia 

[Hypermedia](https://en.wikipedia.org/wiki/Hypermedia) is rich ui content that provides interactivity to enhance and modify the media itself. It provides many advantages when applied to modern web architecture. If you are using any server-rendering, you already are adapting to hypermedia!

This article is requires an advanced understanding of modern JavaScript frameworks and the web in general. If you have topic of interest let me know, there's a lot to learn
- presented in strong opinions loosely held. Like web and js. there's a good chance i made a mistake and was wrong about some things.
- pirate javascript ... calcified ecosystem

> What about htmX and Hypermedia Driven Application (HDA) architecture?

[HDA](https://htmx.org/essays/hypermedia-driven-applications/) has very specific implementation requirements on where and how html is generated and delivered to the client. 

The shift to SSR has proven that hypermedia has already won, the server-client dichotomy is real. But it can be used more flexibly by extending the architecture into the client. In a decidedly more JavaScript-friendly approach, the DOM is the component interface regardless of how and when the html is produced. 

On the other end of the spectrum, rich client experiences are only going to get richer. Streaming generative AI will deliver media and experiences like never before. WASM is bringing a whole new level of experiences through things like WebContainers, a whole mini-fullstack in the browser.

Whether you agree or disagree, there's something to be learned by looking more closely at Hypermedia architectures. 

## Key Characteristics

Hypermedia is fundamentally different from state-driven architectures:

1. The **content media** is the source of truth: the active DOM defines the ui explicitly because it _is_ the ui
1. Hypermedia works in iterative changes triggered by actions
1. Changes to the ui occur in units of ui

The focus in hypermedia is on layout (ui) changes, not state changes. 

## No State?

State-driven frameworks use a "state" api as **the** means to introduce
new data as well as trigger and produce ui layout. Data must be buffered into memory
lifetime of the ui in which it is used.

State is the source of truth and ui follows state, `ui = fn(state)`. No State. No UI

<img width="325" alt="How can you have any UI if you don't set your state" src="https://i.imgflip.com/8h96lh.jpg">

But state as truth is anathema to hypermedia. The Web Platform UI is the medium _and_ the means. Wrapping a virtual paradigm around it adds complexity and cruft, and isolates the developer from access to the Web Platform.

> We don't need reconciliation  
We don't need no dom control  
No dark useEffect in the render  
useState, leave them UIs alone  
_queue mounting guitar rhythm_  
Hey, useState, leave them UIs alone

State here means buffering data into memory on the client so the framework can use that to layout the ui. 


## It's About Time

State-driven architectures are often represented as `ui = fn(state)`. This core state-first requirement is an architecture feature that says to the developer:

> Write `fn` such that it handles all possible states, and it should work at any time.

It's a cool design idea. But also worth thinking about the trade-offs:
- Increased time complexity shows up in effect functions and state management
- Converse template complexity due to time ambiguity: what data do I have right now?
- Impact on ceiling of UX due to canonical loss of direct ui control
- Performance and complexity in limiting rendering due to undifferentiated state change (fine-grained updates address this)

## Time in Hypermedia

Hypermedia consist of iterative changes, each of which occurs at it's own time:

<pre>
ui<sub>n</sub> = ui<sub>n-1</sub> + Δ
</pre>

> The UI is the prior state of the UI plus the delta applied by the last interaction

Conceptually changes are made in compatible units of ui. This is the "swap" in htmX, always html for html. 

Again, because the UI is the source of truth, state is removed from the equation.

## Hypermedia is Already Here

To make this less abstract and more concrete, the current industry adaption of ui<sub>n</sub> = ui<sub>n-1</sub> + Δ is:

```
ui = SSR + islands
```

Those are `ui = fn(state)` islands, but the advantages of a differentiated first render are clear.


## Concrete Example

Heady stuff, time for some code! The examples use React and Azoth. Azoth is a new experimental JavaScript ~~framework~~ library that adheres to a hypermedia architecture.

Below is a data fetch in React

```jsx
import { useEffect, useState } from 'react';
import './style.css';

// emoji service
const EMOJI_URL = 'https://emojihub.yurace.pro/api/all';
async function fetchEmojis() {
  const res = await fetch(EMOJI_URL);
  return await res.json();
}

export default function App() {
  const [emojis, setEmojis] = useState([]);

  useEffect(() => {
    (async () => {
      const emojis = await fetchEmojis();
      setEmojis(emojis);
    })();
  }, []);

  return (
    <>
      <h1>Emojis for Everyone</h1>
      <ul className="emojis">
        {emojis.map(({ name, htmlCode }) => (
          <Emoji name={name} htmlCode={htmlCode} />
        ))}
      </ul>
    </>
  );
}

function Emoji({ name, htmlCode }) {
  return (
    <li title={name} dangerouslySetInnerHTML={{ __html: htmlCode.join('') }} />
  );
}
```

TODO: point out timelines

Azoth!

```jsx
import './style.css';

// emoji service
const EMOJI_URL = 'https://emojihub.yurace.pro/api/all';
async function fetchEmojis() {
  const res = await fetch(EMOJI_URL);
  return await res.json();
}

export default function App() {

  async function EmojiChannel() {
    const emojis = await fetchEmojis();
    return emojis.map(({ name, htmlCode }) => (
      <Emoji name={name} htmlCode={htmlCode} />
    ));
  }

  return (
    <>
      <h1>Emojis for Everyone</h1>
      <ul class="emojis">
        {EmojiChannel()}
      </ul>
    </>
  );
}

function Emoji({ name, htmlCode }) {
  return <li title={name} innerHTML={htmlCode.join('')} />;
}

```






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



