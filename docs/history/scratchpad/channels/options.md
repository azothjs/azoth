# Channel and Provider Options

## Channel Options

Assuming a channel of type `Channel<Input, Output>`:

Option | Value | Description
---|---|---
`startWith` | `Output` of `Channel<I,O>` | Value used as starting output emitted by the channel on creation
`map` | `true` | `Input` is an `Array`, Transform function used as array _map_ to produce output
`initialValue` | `Input` of `Channel<I,O>` | Value passed to transform function with return value emitted by the channel on creation.

## Data Mapping

### `map: true`

Given the prevalence of data arrays, the `map: true` option exists to reduce  
mapping boilerplate:

```jsx
const [Cats] = use(fetchCats(), 
    cats => cats.map(cat => <Cat {...cat}/>), // [!code --]
    cat => <Cat {...cat}/>, // [!code ++]
    { map: true }, // [!code ++]
);
```

### Mapping to Components

Because components are used broadly for composition in Azoth, the input parameter 
design for functions should consider use outside of prop passing. 

For example, one dilemma (or design preference) in components is whether to use:

```jsx
// 1) dedicated prop for cat object
cat => <Cat cat={cat} />

// 2) Apply props from object
({ name, image, blurb }) => <Cat name={name} image={image} blurb={blurb}/>

// same prop api as #2, nicer spread syntax
cat => <Cat {...cat} />
```

In channels, designing components to directly received their domain object offers
a shorthand opportunity to use the component _as_ the transform function for the 
most simple baseline cases:

```jsx
const [Cats] = use(fetchCats(), // [!code --]
    cat => <Cat {...cat}/>, // [!code --]
    { map: true }, // [!code --]
); // [!code --]
const [Cats] = use(fetchCats(), Cat, { map: true }); // [!code ++]
```

## Start With

The `startWith` option specifies a first value to output from the channel
on creation prior to receiving asynchronous input into the channel.

For example, providing a loading component prior to displaying a
list:

```jsx
const [Cats] = use(fetchCats(), Cat, { startWith: <Loading/> });
```

It keeps the layout logic within the channel for the UI it controls, and
keeps the host and channel strongly decoupled:

```jsx
return <ul>
    <!-- No coupling to what happens here: -->
    {Cats} 
</ul>
```

## Initial Value

The `initialValue` option specifies a value to pass to the transform
function, which is used to provide output from the channel on creation prior to receiving asynchronous input into the channel.

For example, a counter button:

```jsx
let count = 0;
const [CountChannel, dispatch] = use(() => ++count, { startWith: count });
```

::: info Difference between `startWith` and `initialValue`

The `startWith` option does **not** use the transform function. It is 
able to provide an alternative first output decoupled from the expected 
data and transform logic used in the channel.

In contrast, the `initialValue` option is _always_ passed to the transform
function. It is generally used for state management with channels when 
the channel as intimate knowledge of the changing source data.

These two options are mutually exclusive and `use` will throw an error 
if both are provided.

:::