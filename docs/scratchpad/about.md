# Rethinking JavaScript Web Development

Azoth itself is an ahead-of-time compiler for JSX plus a minimal set of front-end services and runtime libraries.

At first glance, the JSX syntax looks familiar. However, both the semantic meaning of JSX and the rendering paradigm in which it exists are radically different from the vdom (e.g. React) and state-driven frameworks (just about everything) of the past decade.

Which means explaining Azoth requires both technical instruction on the new use of JSX as well as learning a new approach to the web platform. Luckily, the second task becomes progressively easier as it is really about unlearning the current paradigm and returning to alignment with the web platform.

Here is a summary comparison:

&nbsp;|Azoth      |React
---|---|---


**JSX**
- 

If `ui = fn(state)` represents the 
It's not just different, but anathma
 As a high-level summary:



## Syntax Highlighting


### Traditional Templates

Consider the following template in a state-driven framework (for simplicity, there are no loading semantics):

```jsx
return <div>{items && <List items={items}/>}</div>;
```

There's an intentional ambiguity in this template: Is it _waiting_ for items? Or is it mitigating a response that _didn't have items_? Or both?

This is intended as a DX feature, part and parcel of thinking in `ui = fn(state)`.

But is that the best way to think about it?
