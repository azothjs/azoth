# 💎 diamond

* [Install and Build](#install-and-build)
* [Developer Guide](#developer-guide)

## Install and Build

You need both the `diamond-ui` runtime and some form of the compiler to 
run diamond.

### Runtime Install

```
> npm install diamond-ui -S
```

### Build Install and Config

#### Rollup

```
> npm install rollup-plugin-diamond -D
```

And in `rollup.config.js`:

```js
import diamond from 'rollup-plugin-diamond';

export default {
    entry: 'src/index.js',
    format: 'iife',
    plugins: [
        diamond()
    ],
    dest: 'bundle.js'
};
```

#### Compiler

The diamond compiler [here](https://github.com/martypdx/diamond-compiler) is the transformation function to adapt to other build systems.

## Developer Guide

### Compiled Syntax

The current developer syntax is 100% valid ESNext JavaScript, making it easy to use existing IDE features.  Before being run, parts of the source code are compiled (into valid ES JavaScript) and the html is extracted out into static template fragments. 

### Basic Templates

Diamond templates are JavaScript template literals prefixed with a `_` tag, usually returned
from a function that specifies the data to be mixed into the template. 

For templates that will render to the DOM once, it looks nearly identical to basic template literal string interpolation:

```js
import { _ } from 'diamond-ui';
const greeting = (name=$) => _`<span>Hello ${name}!</span>`;
```

Except that diamond templates return a document fragment instead of string:

```js
const fragment = greeting('Diamond');
document.body.appendChild(fragment);
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

Suffix function parameters with a default value of `$`, imported from the `diamond-ui` library, to mark those inputs as observables. Inside the function those arguments are unchanged. However when used within `${ ... }`, the first emitted value of the observable will be used:

```js
import { _, $ } from 'diamond-ui';
import { Observable } from 'rxjs-es/Observable';
import 'rxjs-es/add/observable/of';

const greeting = (name=$) => _`<p>Hello ${name}!</p>`;
const name = Observable.of('Diamond');
const fragment = greeting(name);
document.body.appendChild(fragment);

// <p>Hello Diamond!</p>
```

### Observable Binding

#### `*` Map 

By prefixing the `${ ... }` with a `*` character, that part of the template
will be bound to the observable and change as new values are emitted:

```js
import { _, $ } from 'diamond-ui';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';

const hello = (name=$) => _`<p>Hello *${name}!</p>`;
const name = new BehaviorSubject('Diamond');

const fragment = hello(name);
document.body.appendChild(fragment);
// <p>Hello Diamond!</p>

name.next('Portland');
// <p>Hello Portland!</p>
```

The returned fragment has an unsubscribe method used to stop listening to the observables:

```js
fragment.unsubscribe();
name.next('San Francisco');
// still: <p>Hello Portland!</p>!
```

Expressions are supported as the template value is "mapped" from the observable(s):

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



