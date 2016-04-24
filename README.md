# 💎 diamond

Superstatic UI Rendering Library

## What's this about?

`diamond` is an experimental ui rendering library that supports 
recursive, templated data binding - written as simple
and fast as possible.

How fast? `diamond` can rival, or even be faster, than the same 
content rendered as a static document.

## How is that even possible?

`diamond` is an attempt to adapt the fastest vanilla js solution to 
data-binding and turn that into a rendering engine. For more technical details, 
see [this explanation](./HOW-IT-WORKS.md).

## Project Scope

`diamond` is intended as a ui rendering engine only. Its job is to create and 
update dom nodes as fast and efficiently as possible. 

In fact there's no parser in `diamond`, it exposes very general capabilities to
supply a template fragment and a set of binding functions, as well as a "context"
interface that is passed into binding functions so they can report data changes
 and have `diamond` render or update ui as necessary.

For simple projects, it may be possible to directly use `diamond`. The
more expected case would be to go through a library or framework that provided
a developer-centric api.

At a high-level `diamond` should offer an API for:

1. Rendering dom output based on one or more related templates
2. Binding nested sections that can maintain `0` to `n` instances
3. Binding to text nodes and form controls
4. Selective one-time, one-way, and/or two-way data binding
5. Reporting specific data changes including specific list-oriented
interfaces for fast array "splice" bindings.

While `diamond` will have a notification api through which data changes are communicated, it
will not offer any data tracking and mutation services, only the api for notifying the 
engine to update specific content.

## Background

I am a contributor to [RactiveJS](github.com/ractivejs/ractive). This project 
is an attempt to synthesize many ideas, based on both the good and bad of 
working with the Ractive code base and looking and other js ui libraries and frameworks.

As mentioned above, I'm starting by reducing the scope to just the rendering engine. 
Obviously Ractive would be good fit for first possible integration once the library is
matured enough to be usuable.

## Running the Project

Everything available via `npm start`. `localhost:4567` will run
the tests. `localhost:4567/research/[name].html` has some full 
page examples and research.

If you want to build a stand-alone version of the library, run 
`gobble build dist -f` where `dist` is the name of the destination directory
 (the `-f` flag forces the directory contents to be recreated, so don't try to build
 into an existing directory with other files you need to keep). 


