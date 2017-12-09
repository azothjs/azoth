

Azoth is an Ahead-of-Time (AoT) compiled JavaScript UI library.
that delivers performance and speed thru minimal architecture 

Azoth architecture and AoT compilation removes two of the primary 
sources of overhead in rendering:
* There is no metadata or intermediate format for creating HTML. It can be directly
loaded in the browser as HTML and utilized by Azoth for template creation
* There is no metadata or intermediate format used to specify template binding. Instead the compiled JavaScript binds the template in a linear fashion, regardless of
the tree structure of the DOM being bound.

Azoth allows binding to normal JavaScript values and objects, as well as 
utilizing observables to bind to data that may change over time or not be
immediately available.

This means there is also no rendered representation (virtual dom) that needs to be maintained, checked or computed to make updates. All change management happens _outside the view layer_.



Offers a JavaScript first approach for composing UI while adhering to
a DOM-based 