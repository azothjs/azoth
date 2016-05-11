What if we researched the fastest possible Vanilla JavaScript for web rendering and turned that into a 
UI library? 

Diamond (https://github.com/martypdx/diamond) is a new, bare-metal, 
fully-recursive (think components and sections), JavaScript UI library that does just that.
The resulting performance is as fast or faster than the same content rendered as a static document!
JavaScript rendering time happens in tens of milliseconds, not hundreds.

It turns out that the DOM isn't as slow as you've been led to believe. The more work we 
let the browser do, the more minimal and effective our JavaScript rendering engine can be.

Templated architectures now have a distinct advantage over dom-diffing, meaning the 
fatigue of isomorphic JavaScript, immutability and service-workers is no longer required 
to get great performance and responsiveness.

We'll look at code, learn about the DOM, run some profiles, and categorize performance 
numbers to better understand the complete story of a ui library or framework.

Attends will learn:

* More about the DOM:
	* fragment cloning (cloneNode)
	* querySelectorAll beats JavaScript
	* form controls are more expensive than text
	
* JavaScript at rendering-library scale:
	* old-fashion loops beat functional programming
	* best performance is the work you avoiding doing
	* smaller footprint means faster first render
	* designing the rendering for less memory
	
* Contrast "Always Be Rendering" Dom-diffing versus templated architectures
		
* How to evaluate performance as relation of:
	* first-render time
	* library size
	* memory
	* responsiveness (update)