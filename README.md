# 💎 diamond

superstatic ui rendering library:

* fast or faster than same content rendered as a static document
* supports nested sections
* some simple data-bindng (think todo list)

`diamond` is an attempt to adapt the fastest vanilla js solution to 
data-binding and turn that into a rendering engine. For more technical details, 
see [this explanation](./HOW-IT-WORKS.md).

## Running the Project

Currently the project is in research and early development, so a bit lacking on
packaging and deployment (but not tests!).

Start the gobble dev server via `npm start` and go to `http://localhost:4567` 
to runs the tests.

The research directory is also served, checkout   
`localhost:4567/research/diamond.html` for todo example.

If you want to build a stand-alone version of the library, run 
`gobble build dist -f` where `dist` is the name of the destination directory
 (the `-f` flag forces the directory contents to be recreated, so don't try to build
 into an existing directory with other files you need to keep). 


