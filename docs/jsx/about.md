# JSX

Azoth compiles JSX into static HTML and runtime JavaScript:
- JSX compiles to DOM literal at runtime
- Child `{...}` supports asynchronicity
- Compose with custom-elements or Components

## DOM Literals

JSX is compiled into self-rendering DOM literals at runtime. While there are runtime services, there's no framework used to run the app. Use the DOM nodes directly:

```jsx
document.append(<h1>Hello {'World'}</h1>);
```

As a literal value, it can be used with any DOM API. Move fluidly between declarative templates and imperative JavaScript:

```jsx

```

## Templates

Each block of JSX is treated as template that gets compiled into HTML and JavaScript. Azoth's runtime services provide template creation and tracking capabilities transparently in the generated code.  

## Expression Containers `{...}`

JSX expression containers either:
- compose child nodes, or
- set properties


## Elements

Supported element use:

type | example | creator | trigger
---|---|---|---
HTML Elements | `<div>` | html | W3C
Unknown Elements | `<foo>` | html | default
Custom Elements | `<web-component>` | html | `-` (hyphen)
Components | `<Component>` | js | TitleCase

### Creation

The first three element types are delivered via html and created by the browser. 

Components are developer-authored constructs for managing templates delivered via functions, classes, or objects.

### Void Elements

JSX follows XML tag rules which requires void elements to be represented as self-closing elements (these get compiled back to void elements):

```jsx
<img src="url.png" alt="image"> // [!code --]
<img src="url.png" alt="image"/> // [!code ++]
```

### Self-Closing Elements

JSX also allows self-closing elements which are compiled to correctly formatted html tags. This works for custom elements too!

```jsx
<card-list items={cats} />
```



### HTML Attributes and DOM Properties

Because Azoth splits templates into static and runtime parts at compile time, static and dynamic attributes are handled differently on HTML, unknown, and custom elements.

```jsx
<input name="title" required value={title}/>
```

Static vales become HTML attributes:

```html
<template>
    <input name="title" required />
</template>
```

JSX expressions are property assignments:

```js
input.value = title;
```

### Event Properties

Use built-in DOM event properties to register handlers:

```jsx
<button onclick={() => alert('clicked')}>Click Me!<button>
```


- Interpolation (mixing in JavaScript values and expressions)

- Composing with JavaScript
- Composing with Elements (custom elements and components)

```jsx
const pinkPanther = <li>Pink Panther</li>;
pinkPanther.classList.add('cartoon');

const cats = <ul>
    <ul>
    {[stimpy, felix, pinkPanther]}
    <li class="cartoon">
        {document.createTextNode('sylvester')}
    </li>
</ul>
    <li class="cartoon">tom</li>
    <li class="cartoon">stimpy</li>
    <li class="movie">cheshire</li>
</ul>;

const [felix, , stimpy] = cats.querySelectorAll('.cartoon');

document.append(<ul>
    {[stimpy, felix, pinkPanther]}
    <li class="cartoon">
        {document.createTextNode('sylvester')}
    </li>
</ul>);
```