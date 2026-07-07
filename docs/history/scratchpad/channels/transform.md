# Transform

Channel transform functions process one or more values 
received from an asynchronous data source.

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

Channels can be:
- Passed to child node `{Channel}` expression containers, or used as components via `<Channel/>`
syntax accept asynchronous data sources. Either of these syntaxes do more or less the same thing:

```jsx
<ul>{CatsChannel}</ul>;
```

```jsx
<ul><CatsChannel/></ul>;
```

Except the later can accept child slottable content and layout props.

::: tip Channel output needs to be DOM
Any content that works with `node.append()`, or an array such values. See the core JSX [compose](../jsx/compose) docs for more details.
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

