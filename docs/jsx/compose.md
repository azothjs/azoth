# Child Composition `{...}`

JSX expression containers accept a variety of data types when used for 
element children. The end goal is a DOM Node that can be appended as a 
child of the parent element.

```jsx
<>
    <h1>
        {<span>Hello</span>} {'World'}
    </h1>
    <ul>
        {fetchList().then(list => list.map(item => <li>item</item>))}
    </ul>
</>
```

:::tip DOM not Data
Think about layout management when using child expression composition. 
Data structures and service updates need to be processed into presentation layout first!
:::

## Evaluation

At runtime, the supplied expression value is evaluated in the following order:

test by | target | action (+recurse)
---|---|---
value | `undefined`, `null`, `true`, `false`, or `''` | ignore\|remove
type | `string` or `number` | append
instance | `Node` | append
type | `function` | call+
instance | `Promise` | then+
value | `Array.isArray` | map+
**type** | **`object`** | **and...** 
has | `[Symbol.asyncIterator]` | iterate+
instance | `ReadableStream` | write+
has | `.subscribe` | observe+
**no match** | | throw

## Text and Raw HTML

### Text

Strings and numbers are rendered by the browser as text content:

```jsx
<p>Hello {'World'}! You have {3} unread messages</p>
```

### Ignored Values

`true`, `false`, `undefined`, and `null` values are ignored:

```jsx
<p>
    Welcome {user?.vip && 'VIP'}!
    {user?.validated || 'Please validate your account' }
</p>
```

### Raw HTML

Use the DOM `innerHTML` property for raw HTML:

```jsx
<p aria-label="content" contenteditable innerHTML={content} />
```

### Text Content

You can optionally use the `textContent` property in the same manner:

```jsx
<span>{name}</span> // [!code --]
<span textContent={name} /> // [!code ++]
```

::: warning
Both `.innerHTML` and `.textContent` are destructive and will replace all existing child content of the element
:::

## DOM Nodes

Compose with any DOM Node using any JavaScript expression:

```jsx
const felix = <li>felix</li>;
<ul>
    {felix}
    {<li>stimpy</li>}
    <li>
        {document.createTextNode('sylvester')}
    </li>
</ul>
```

Use this technique to lift a DOM node out of the template for more fine grained control:

```jsx
const specialSpan = <span>{special}</span>; // [!code ++] 
gsap.to(specialSpan, { rotation: 27, x: 100, duration: 1 }); // [!code ++] 

<section>
    <p>{content}</p>
    <p>
        <span>{special}</span> // [!code --] 
        {specialSpan} // [!code ++] 
        More Content
    </p>
</section>
```

:::info Is this like `ref`?
This is similar in concept to using `ref`, but the DOM is the API in Azoth and you're encouraged to directly manipulate elements.
:::

## Arrays

Each member of the array is recursively processed until resolved by the child expression container. Array order is maintained:

```jsx
const list = <ul>
    {cats.map(cat => <li>{cat.name}</li>)} // [!code highlight]
</ul>

const header = <header>Cat List</header>;
const main = <div>{list}</div>;
const footer = <footer>&copy; 2024 cats-r-us</footer>;

const section = <section>
    {[header, main, footer]} // [!code highlight]
</section>;
```
