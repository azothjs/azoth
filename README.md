# 💎 azoth

* [Install and Build](#install-and-build)
* [Developer Guide](#developer-guide)

## Install and Build

You need both the `azoth` runtime and some form of the compiler to 
run azoth.

### Runtime Install

```
> npm install azoth -S
```

### Build Install and Config

#### Rollup

```
> npm install rollup-plugin-azoth -D
```

And in `rollup.config.js`:

```js
import azoth from 'rollup-plugin-azoth';

export default {
    entry: 'src/index.js',
    format: 'iife',
    plugins: [
        azoth()
    ],
    dest: 'bundle.js'
};
```

#### Compiler

The core transformation is in the compiler repo [here](https://github.com/martypdx/azoth-compiler) for adapting to other build systems.

### Examples

There are simple example apps [here](https://github.com/martypdx/azoth-example)

## Developer Guide

### Compiled Syntax

The current developer syntax intentionally only uses valid ESNext JavaScript, making it easy to use existing IDE features.  As part of your build process, parts of the source code (functions and templates) are compiled. The static html is extracted out and the remaining expression are reworked into binding JavaScript executed at runtime.

### Basic Templates

azoth templates are JavaScript template literals prefixed with a `_` tag, usually returned
from a function that specifies the data to be mixed into the template. 

The binding semantics are very explicit and require understanding how the data is to interact with the DOM, both initially and over time. 

In the simplest case of using normal JavaScript objects and values, the templates will look nearly identical to basic template literal string interpolation:

```js
import { _ } from 'azoth';
const greeting = (name=$) => _`<span>Hello ${name}!</span>`;
```

Except that templates return a document fragment instead of string:

```js
const fragment = greeting('azoth');
document.body.appendChild(fragment);
// <span>Hello azoth!</span>
```

### Blocks

Interpolated expressions (`${ ... }`) are marked with a trailing `#` to indicate
that a template or an array of templates will be returned:

```js
function(items) {
    const noItems = _`There are <em>no</em> items :(`;
    const itemCount = _`There are <strong>${items.length}</strong> items`;

    return _`
        <h1>${ items.length ? itemCount : noItems }#</h1>
        <ul>
            ${items.map(item => _`
                <li>${item}</li>
            `)}#
        </ul>
    `;
}
```

### Observables

Suffix function parameters with a default value of `$`, imported from the `azoth` library, to mark those inputs as observables. Inside the function generally, those arguments are unchanged: 

```js
import { _, $ } from 'azoth';
import { Observable } from 'rxjs-es/Observable';
import 'rxjs-es/add/observable/of';

const greeting = (observable=$) => _`<div>${observable}</div>`;
const name = Observable.of('azoth');
const fragment = greeting(name);
document.body.appendChild(fragment);

// <span>[object Object]</span>
```

This can be useful when passing observables through to other subtemplate functions.

### Observable Bindings

Prefix the `${ ... }` with a sigil for different binding behaviors:

|sigil|type
|---|---|
|`*`|map|
|`$`|first value|
|`@`|subscribe|

#### `$` First Value

The first emitted value of the observable will be used, but then the binding will be
unsubscribed:

```js
import { _, $ } from 'azoth';
import { Observable } from 'rxjs-es/Observable';
import 'rxjs-es/add/observable/of';

const greeting = (name=$) => _`<p>Hello ${name}!</p>`;
const name = Observable.of('azoth');
const fragment = greeting(name);
document.body.appendChild(fragment);

// <p>Hello azoth!</p>
```


#### `*` Map 

Bind that part of the template to the observable and change as new values are emitted:

```js
import { _, $ } from 'azoth';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';

const hello = (name=$) => _`<p>Hello *${name}!</p>`;
const name = new BehaviorSubject('azoth');

const fragment = hello(name);
document.body.appendChild(fragment);
// <p>Hello azoth!</p>

name.next('Portland');
// <p>Hello Portland!</p>
```

Expressions are fully supported and can include multiple observables:

```js
const template = (x=$, y=$) => _`*${x} + *${y} = *${x + y}`;
const x = new BehaviorSubject(5);
const y = new BehaviorSubject(2);

document.body.appendChild(template(x, y));		
// 5 + 2 = 7

x.next(3);
y.next(1);
// 3 + 1 = 4

```

Expressions maintain their scoping within the module, so outside functions and values can be used:

```js
import moment from 'moment';
const template = (date=$) => _`<span>*${moment(date).fromNow()}</span>`;
```

## License

[MIT](LICENSE)



