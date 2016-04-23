# 💎diamond

Superstatic UI Rendering Library

## What's this about?

`diamond` is an experimental ui rendering library that offers fully 
recursive, templated data binding - written to be as simple and as fast as possible.

How fast? `diamond` can rival, or even be faster, than the same 
content rendered as a static document.

## How is that even possible?

There are three things that make diamond so fast:

### 1. Cloning

It utilizes the DOM's `.cloneNode(true)` to deep clone template fragments 
and create instances at a fraction of the speed it takes to create new DOM nodes
from scratch. Checkout out `research/vanilla-js.html` compared to 
`research/document.html` to understand this built-in DOM boost,

### 2. Shift Work

Conceptually, `diamond` divides work into three categories:

1. Deterministic work that can be done at "parse" time to produce a template
definition. This is essentially *free* time and anything that can be determined
upfront should be done at parse time.

2. Creating the template tree. `diamond` constructs a template hierarchy that 
corresponds 1-to-1 with the template and any contained sections (it does *not* 
create a POJO hierarchy for the entire actualized dom tree). Any work
that will be common to all instances of a template section should be determined
in the template, not the rendered dom node instances.

3. Binding functions are executed for any bound node instance along with 
the data context. Any work that is instance specific happens here.
	 
### 3. Very Vanilla JS

In critical rendering paths, iterating trees is expensive. Functional programming 
and closures are expensive. Calling too many functions can get expensive. So you will
see unglamorous code like:

```js
for ( var i = 0, l = children.length; i < l; i++ ) {
```

## But How does it work?

TODO:
* fragment and binding tree
* recursive sections

## What is the API?

While the API is very much in progress, more important is
understanding the boundaries for the project:

1. The DOM fragment
2. The binder interace, which is simple a function that
   accepts the created node
3. The context api which includes
	* methods for getting, setting and observing
	* "reference" object options that describe which what
	data(s) to use and optionally expression to be applied

## Running the Project

Everything available via `npm start`. `localhost:4567` will run
the tests. `localhost:4567/research/[name].html` has some full 
page examples and research. 


