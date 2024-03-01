# Transform

Transform functions process values received from an asynchronous data source.

```jsx
function Cats() {
    // `fetchCats` returns a `promise<Array>`
    const [CatsChannel] = use(fetchCats(), cats => {
        return cats.map(({ name, image, blurb }) => (
            <Cat name={name} image={image} blurb={blurb}/>
        );
    };

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
syntax accept asynchronous data sources. These do more or less the same thing:

```jsx
<ul>{CatsChannel}</ul>;
```

```jsx
<ul><CatsChannel/></ul>;
```

::: tip Channel output needs to be DOM
Any content that works with `node.append()`, or an array such values. See the core JSX [compose](../compose) docs for more details.
:::

::: warning Props do not resolve values
Because property expression containers can be used to pass any data type to a component,
they will not resolve to values for property: 
```jsx
const [CatsChannel] = use(fetchCats());
<MyComponent cats={CatsChannel}/>
```
The channel itself _is_ passed to the component and can be used accordingly. 
:::

## Cleaner Code

Channels has a few APIs that help reduce the amount of boilerplate code:
- [Data Mapping](#data-mapping)
- [Mapping to Components](#mapping-to-components)
- [Clean Data](#clean-data)

Covering these first will simplify the code examples afterwards.

### Data Mapping

Arrays of data are so prevalent that you can use the `map: true` option to auto map the resolved value to the transformation function. 

```jsx{4,5}
const [CatsChannel] = use(
    fetchCats(),
    // directly use map transform function:
    ({ name, image, blurb }) => <Cat name={name} image={image}, blurb={blurb}/ >,
}, { map: true }); 
```

### Mapping to Components

When creating domain components, one design dilemma is whether to use:

```jsx{2,5,8}
// dedicated prop for cat object
cat => <Cat cat={cat} />

// use obj to apply props (different methods)
({ name, image, blurb }) => <Cat name={name} image={image} blurb={blurb}/>

// same thing, nicer spread api - not yet supported :(
cat => <Cat {...cat} />

// ¯\_(ツ)_/¯
```

Ultimately the answer is "it depends" :) 

However, there are design benefits to using the later choice with mapped components. We get more concise code and remove a wrapper layer when the component _is_ the transform function:


```jsx
const [CatsChannel] = use( // [!code --]
    fetchCats(), // [!code --]
    ({ name, image, blurb }) => <Cat name={name} image={image} blurb={blurb} />, // [!code --]
}, { map: true }); // [!code --]
// The function above really means: 
// ({ name, image, blurb }) => { 
//    return Cat({ name, image, blurb }), 
// } 
// wowsa! just let Cat(cat) happen  // [!code ++]
const [CatsChannel] = use(fetchCats(), Cat); // [!code ++]
```

Slottable child content still always requires explicit `<Component>` syntax:

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

Have service providers give the UI immediately usable data in the format it expects:

```jsx
const [DogsChannel] = use(fetchDogs(), Dog, { map: true });
```

This keeps your UI channels code clean and focused on layout management. Channels can be used with pure data in the service layer as well:

```jsx
export async function fetchDogs()
    const [promise] = use(fetch(DOGS_URL), async res => {
        const { response } = await res.json();
        return response.data;
    });
    return promise;
}
```

## Start With



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

```jsxG
// use map and loading:
[cats => <CatCount count={cats.length} />, { 
    map: true,
    startWith: <Loading/> 
}],
// simple transform with number/string values:
[({ length }) => length, { startWith: '...'}]
```
