# 💎 diamond

## Developer Guide

### Compiled Syntax

The current developer syntax is valid ESNext JavaScript, making it easy to use existing IDE features.  Before it is run, parts of the source code are compiled (also valid ES JavaScript) and the html is extracted out into static template fragments. 

### Basic Templates

Diamond templates are JavaScript template literals prefixed with a `_` tag, usually returned
from a function that specifies the data to be mixed into the template. 

For templates that will render to the DOM once, it looks nearly identical to basic template literal string interpolation:

```js
import { _ } from 'diamond-ui';

const list = items => _`
    <ul>
        ${items.map(item => _`
            <li>${item}</li>
        `)}
    </ul>
`;

const items = getListOfItems();
const fragment = list(items);
document.body.appendChild(fragment);
```

### Observables

By suffixing function parameters with a default value `$` imported from the `diamond-ui` library:



