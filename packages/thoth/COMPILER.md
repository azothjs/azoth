# Thoth: The Azoth Compiler

Thoth transforms JSX into DOM literals. This document explains how.

---

## High-Level Overview

```
JSX Source → Parse (Acorn) → Generate (Transpiler) → Output
                                                      ├── JavaScript code
                                                      ├── Template metadata
                                                      └── Source map
```

**The key insight:** Azoth doesn't deliver HTML via JavaScript calls like React. It extracts HTML into the HTML document itself, letting the browser's native HTML parser create DOM. This avoids parsing JavaScript just to create DOM.

---

## The Compilation Pipeline

### 1. Parse: JSX → AST

```javascript
import { Parser } from 'acorn';
import acornJsx from 'acorn-jsx';

const JsxParser = Parser.extend(acornJsx());
const ast = JsxParser.parse(code, { sourceType: 'module', locations: true });
```

Standard Acorn with JSX extension. Nothing special here.

### 2. Generate: AST → Code + Templates

```javascript
const generator = new Transpiler();
const { code, templates, map } = generateWith(generator, ast, config);
```

The `Transpiler` walks the AST, collecting template information and transforming JSX expressions into template function calls.

**Example transformation:**

```jsx
// Input
const t = <p className={status}>Hello {name}</p>;

// Output JavaScript
import { te6c2b6be } from 'virtual:azoth-templates?id=e6c2b6be';
const t = te6c2b6be(status, name);
```

**Output template metadata:**
```javascript
{
  id: "e6c2b6be",           // Hash identifying this template
  html: "<p>Hello <!--0--></p>",  // Static HTML
  targetKey: "0fb6cfb2",    // Hash for targets function
  bindKey: "4e0c0070",      // Hash for bind function
  tMap: "[-1,[1]]",         // Target map
  bMap: "[0,1]",            // Bind map
  propertyNames: ["className"]
}
```

---

## Template Extraction: The Core Mechanism

### Why Extract HTML?

The browser's HTML parser is fast and doesn't require JavaScript interpretation. By putting HTML directly in the document (via `<template>` tags or inlined), we:

1. Skip JavaScript parsing overhead
2. Let the browser do what it's optimized for
3. Make templates serializable (can be in the HTML file)

### What Gets Extracted

For each JSX expression, Thoth extracts:

| Field | Purpose |
|-------|---------|
| `id` | Unique hash identifying the template |
| `html` | Static HTML with placeholders |
| `targetKey` | Hash for the targets function |
| `bindKey` | Hash for the bind function |
| `tMap` | Target map - locating binding points |
| `bMap` | Bind map - binding operation types |
| `propertyNames` | Dynamic property names |
| `isDomFragment` | Whether this is a fragment |
| `isEmpty` | Whether the template is empty |

### The Comment Node Trick

Text interpolators become comment nodes to preserve child node structure:

```jsx
// Input
<p>Hello {name}!</p>

// Extracted HTML
<p>Hello <!--0-->!</p>
```

Why? Without the comment, "Hello " and "!" would merge into one text node. The comment creates a tangible child node that preserves the three-node structure: text, comment, text.

### The `data-bind` Attribute

Elements with dynamic children get marked:

```jsx
// Input
<div>
  <p>static</p>
  <p>{dynamic}</p>
</div>

// Extracted HTML
<div>
  <p>static</p>
  <p data-bind><!--0--></p>
</div>
```

At runtime, `querySelectorAll('[data-bind]')` finds these elements. The query returns results in **document order (depth-first)**, which the target map relies on.

---

## The Three Generators

The compilation is decomposed into three functions that work together:

### 1. Targets Generator (`makeTargets`)

**Purpose:** Given DOM nodes from querySelectorAll, refine to the specific nodes that need binding.

```javascript
// Input: JSX
name => <p>hello {name} <Display/></p>

// Output: targets function
r => [r.childNodes[1], r.childNodes[3]]
```

The function receives the root element (`r`) and optionally the array of `data-bind` elements (`t`). It returns an array of the precise DOM nodes that will receive values.

### 2. Bind Generator (`makeBind`)

**Purpose:** Given targeted nodes, create a function that knows how to set values on them.

```javascript
// Input: JSX
<p className={"className"}>{"Greeting"} <span>hey {"Azoth"}!</span></p>

// Output: bind function
(ts) => {
  const t0 = ts[0], t1 = ts[1], t2 = ts[2];
  return (v0, v1, v2) => {
    t0.className = v0;    // Property assignment
    __c(t1, v1);          // Compose into child position
    __c(t2, v2);          // Compose into child position
  };    
}
```

**Binding operations:**
- Property assignment: `t0.className = v0`
- Dataset assignment: `t0.dataset.id = v0`
- Spread props: `Object.assign(t0, v0)`
- Child compose: `__c(t0, v0)` (calls Maya's compose)
- Component compose: `__cC(t0, v0)` (calls Maya's composeComponent)

### 3. Render Generator (`makeRenderer`)

**Purpose:** Generate the call to Maya's `__renderer` function.

```javascript
// Output
__renderer("77e67b80", g5feceb66, b6b86b273, false, `<p><!--0--></p>`)
```

Arguments:
1. Template ID hash
2. Reference to targets function (or null if static)
3. Reference to bind function (or null if static)
4. isFragment flag
5. HTML content (inlined in dev, extracted in prod)

---

## Runtime Integration (Maya)

The generated code calls into Maya's renderer system:

```javascript
// packages/maya/renderer/renderer.js

export function renderer(id, targets, makeBind, isFragment, content) {
  const create = get(id, isFragment, content);  // Get or create template
  
  function getBound() {
    // Clone template, get bound elements, create bind function
    const [node, boundEls] = create();
    const nodes = targets ? targets(node, boundEls) : null;
    const bind = makeBind ? makeBind(nodes) : null;
    return [node, bind];
  }
  
  return (...args) => {
    const [root, bind] = getBound();
    if (bind) bind(...args);  // Apply values
    return root;              // Return DOM
  };
}
```

This is the magic that produces DOM literals at runtime.

---

## Render Engine Abstraction

Maya supports swappable render engines:

```javascript
export const RenderService = {
  useDOMEngine() { renderEngine = DOMRenderer; },
  useHTMLEngine() { renderEngine = HTMLRenderer; }
};
```

The same compiled code can produce:
- **DOM mode:** Actual DOM nodes (browser)
- **HTML mode:** HTML strings (server-side, future)

The HTML engine isn't fully built yet, but the architecture supports it.

---

## Production vs Development

**Development:** HTML is inlined in the template function calls for convenience.

**Production:** Vite plugin extracts HTML into `index.html` as `<template>` tags. The virtual imports resolve to functions that clone from those pre-parsed templates.

---

## Deduplication

The decomposition into separate templates, targets, and bind functions enables smart deduplication:

**HTML templates:** Same content = same template ID
```jsx
const a = <p>{name1}</p>;
const b = <p>{name2}</p>;
// Both use template "77e67b80" - same HTML structure
```

**Bind functions:** Same binding pattern = same function
```jsx
const a = <p>{x}</p>;
const b = <div>{y}</div>;
// Different elements, but same binding pattern (one child compose)
// Can share the same bind function: (ts) => { return (v0) => { __c(ts[0], v0); }; }
```

This emerges naturally from decomposing the compilation into these pieces.

---

## Static Optimization

Templates with no dynamic bindings are optimized:

```jsx
// Input
const template = <p>Hello</p>;

// Output - no bind function needed
const template = td0a26d23();

// Template metadata
{
  html: "<p>Hello</p>",
  targetKey: "",      // Empty - no targets
  bindKey: "",        // Empty - no bindings
  tMap: "null",
  bMap: "null"
}
```

---

## Summary

1. **Parse:** Acorn + JSX extension
2. **Extract:** HTML with `<!--0-->` placeholders and `data-bind` markers
3. **Generate:** Three functions (targets, bind, renderer)
4. **Runtime:** Maya clones template, locates targets, applies bindings
5. **Result:** DOM literal returned to developer

The key differentiator: HTML is parsed by the HTML parser, not constructed by JavaScript. This is both faster and more aligned with how the web platform was designed.
