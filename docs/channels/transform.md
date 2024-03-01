# Transform

Channel transform functions process one or more values received from an asynchronous data source.

```jsx
function Cats() {
    // `fetchCats` returns a `promise<Array>`
    const [CatsChannel] = use(fetchCats(), cats => {
        return cats.map(({ name, image, blurb }) => (
            <Cat name={name} image={image} blurb={blurb}/>
        );
    });

    // Initial render is <ul></ul>
    // CatsChannel promise resolves when data arrives
    return <ul>{CatsChannel}</ul>;
}

function Cat({ name, image, blurb }) {
    return <li>
        <h2>{name}</h2>;
        <img src={image} alt={blurb}/>
        <p>{blurb}</p>
    </li>
}
```

## Using Channels in JSX

Both the child node `{...}` expression container and the `<Component/>`
syntax accept asynchronous data sources. Either of these syntaxes do more or less the same thing:

```jsx
<ul>{CatsChannel}</ul>;
```

```jsx
<ul><CatsChannel/></ul>;
```

Except the later can accept child slottable content and layout props.

::: tip Channel output needs to be DOM
Any content that works with `node.append()`, or an array such values. See the core JSX [compose](../compose) docs for more details.
:::

::: warning Props do not resolve async values
Because property expressions can be used to pass _any_ data type to a component,
they will not resolve to values at the property boundary: 
```jsx
const [CatsChannel] = use(fetchCats());
<MyComponent cats={CatsChannel}/>
```
The channel itself is passed through to the component and can be used accordingly _inside
the component code_. 
:::

## Cleaner Code

There are a few techniques when using channels that can help to reduce the amount of boilerplate code:
- [Data Mapping](#data-mapping)
- [Mapping to Components](#mapping-to-components)
- [Clean Data](#clean-data)

### Data Mapping

Given that arrays of data are so prevalent, the `map: true` option exists to auto map the resolved array value to the transformation function. 

```jsx{4,5}
const [CatsChannel] = use(
    fetchCats(),
    // directly use an item-level map transform function:
    ({ name, image, blurb }) => <Cat name={name} image={image}, blurb={blurb}/ >,
}, { map: true }); 
```

### Mapping to Components

When creating domain components, one design dilemma that always crops up is whether to use:

```jsx
// dedicated prop for cat object
cat => <Cat cat={cat} />

// use obj destructure and apply props
({ name, image, blurb }) => <Cat name={name} image={image} blurb={blurb}/>

// same thing, nicer spread api - not yet supported :(
cat => <Cat {...cat} />

// ¯\_(ツ)_/¯
```

Ultimately the answer is "it depends" :) 

However, there are design benefits to using the later choice with mapped components that directly received domain object data. When the component _is_ the transform function it can be more concise and it removes a wrapper function:

```jsx
const [CatsChannel] = use( // [!code --]
    fetchCats(), // [!code --]
    ({ name, image, blurb }) => <Cat name={name} image={image} blurb={blurb} />, // [!code --]
}, { map: true }); // [!code --]
// The function above really means: 
// ({ name, image, blurb }) => { 
//    return Cat({ name, image, blurb }), 
// } 
// Wowsa! just let Cat(cat) happen  // [!code ++]
const [CatsChannel] = use(fetchCats(), Cat, { map: true }); // [!code ++]
```

This technique only works when there isn't additional work to do in the transform function. It
covers the common base case of passing each object in an array to a component.

Expanded component use, like slottable child content, still always requires explicit `<Component>` syntax:

```jsx{3-5}
const [Channel] = use(
    fetchToys(), 
    ({ name, category, image }) => <Toy name={name} image={image}> 
        <HolidayBanner category="category"/>
    </Toy>,
    { map: true }
);
```

### Clean Data

Avoid having layout transform functions also do data refinement or cleanup:

```jsx{3}
const [DogsChannel] = use(
    fetchDogs(),
    ({ data }) => data.results.map(({ name, image }) => {
        return <Dog name={name} image={image} / >
    }),
});
```

Aim for service providers to give the UI immediately usable data in the format it expects:

```jsx
// dog-service.js
export async function fetchDogs()
    const response = await fetch(DOGS_URL);
    const json = await res.json();
    // adjust data for the ui layer
    return json.data.response;
}

// simplified UI code
const [DogsChannel] = use(fetchDogs(), Dog, { map: true });

```

This keeps your UI channels code clean and focused on layout management.

## Start With


## Initial Value


## Branching

The async source can be branched into multiple channels by supplying additional transform functions. 

```jsx
const [CatsChannel, CountChannel] = use(fetchCatProfile(),
    // Gets array length and creates <CatsCount/>
    ({ length }) => <CatsCount count={length}/>,
    // Maps array to Cat components, notice tuple syntax
    [Cat, { map: true }],
);

return <>
    <h1>{CountChannel} Cats</h1>
    <ul>
        <CatsChannel/>
    </ul>;
</>;
```

With a single transform function, the third argument is used for transform options.
Because transform options like `map` and `startWith` are _per_ transformation, group
functions with their options using an array tuple:

```jsx
// use map and loading:
[cats => <CatCount count={cats.length} />, { 
    map: true,
    startWith: <Loading/> 
}],
// simple transform with number/string values:
[({ length }) => length, { startWith: '...'}]
```
