# 💎 diamond

Superstatic UI Rendering Library

## What's this about?

`diamond` is an experimental ui rendering library that offers fully 
recursive, templated data binding - written so the code is as simple
and fast as possible.

How fast? `diamond` can rival, or even be faster, than the same 
content rendered as a static document.

## How is that even possible?

There are three things that make diamond so fast:

### 1. Cloning

It utilizes the DOM's `.cloneNode(true)` to deep clone template fragments 
and create instances at a fraction of the speed it takes to create new DOM nodes
from scratch. Checkout out `research/vanilla-js.html` compared to 
`research/document.html` to understand this built-in DOM boost.

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
Static nodes do not require any additional work.
	 
### 3. Real Vanilla JS

In critical rendering paths, iterating trees is expensive. Functional programming 
and closures are expensive. Calling too many functions can get expensive. So you will
see unglamorous code like:

```js
for ( var i = 0, l = children.length, child; i < l; i++ ) {
	child = children[i];
	// ...
}
```

Really, it saves 100's of ms.

## But How Does It Work?

Consider the following mustachesque template:

```html
<h2>Contacts</h2>
<ul>
	{{#each contacts}}
	<li><span>{{name}}</span> <tel>{{phone}}</tel></li>
	{{/each}}
</ul>
```

Which we could logically think of as two sections. One
top-level section whose template looks like:

```html
<template id="main">
	<h2>Contacts</h2>
	<ul>
		<!-- each -->
	</ul>
</template>
```

(More on the comment node below.) And an "each" section whose template is:

```html
<template id="contact">
	<li>
		<span>{{name}}</span>
		<tel>{{phone}}</tel>
	</li>
</template>
```

Let's start by looking at applying bindings to the _second_ template:

```js

// create the bindings for the text nodes:
var t1 = bound.text({ ref: { prop: 'name' } });
var t2 = bound.text({ ref: { prop: 'phone' } });

var template = {
	// assume `template` supported:
	fragment: document.getElementById( 'todo' ).content,
	queueBindings( clone ) {
		var bindings = new Array(2);
		var li = clone.children[0];
		bindings[0] = { binder: t1, node: li.children[0].childNode[0] });
		bindings[1] = { binder: t2, node: li.children[1].childNode[0] });
		return bindings;
	}
}

// create a clone and get queued bindings:
var clone = template.fragment.cloneNode( true );
var bindings = template.queueBindings( clone );

// run the bindings:
var each;
for ( var i = 0, l = bindings.length; i < l; i++ ) {
	each = bindings[i];
	each.binding.bind( context, each.node );
}

```

You may be wondering why the bindings were queued and not executing 
on the spot as the node instances were located. 

The main reason is that a binder may mutate the cloned fragment.
For example an iterative section may insert nodes, or a decorator 
may subtly alter the dom making it impossible to find other nodes
that need to be bound. 

Sections are represented as comments in their parents and register
a binding function so the section can do its rendering. Then comment
node also acts as an anchor to place instances of that section:

```js

// create the section bindings:
var s1 = bound.section(
	{ type: 'for', ref: { prop: 'contacts' } },
	// the section template from above
	template );
	
var template = {
	fragment: document.getElementById( 'main' ).content,
	queueBindings( clone ) {
		var bindings = new Array(1);
		// fyi the comment node is after a text node, thus childNodes[1] 
		bindings[0] = { binder: s1, node: clone.children[1].childNodes[1] });
		return bindings;
	}
}

// create a clone and get queued bindings:
var clone = template.fragment.cloneNode( true );
var bindings = template.queueBindings( clone );

// run the bindings:
var each;
for ( var i = 0, l = bindings.length; i < l; i++ ) {
	each = bindings[i];
	each.binding.bind( context, each.node );
}

```

## So What's the API?

While the API is very much in progress, more important is
understanding the boundaries for the project:

1. The DOM fragment
2. The binder interface, which is simple a function that
   accepts the created node
3. The context API which includes
	* methods for getting, setting and observing
	* "reference" object options that describe which what
	data(s) to use and optionally expression to be applied

## Running the Project

Everything available via `npm start`. `localhost:4567` will run
the tests. `localhost:4567/research/[name].html` has some full 
page examples and research. 


