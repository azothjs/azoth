
```jsx
const cat = {
    name: 'duchess',
    image: 'duchess.png',
}

const card = <div>
    <h2>{cat.name}</h2>
    <img src={cat.image} alt={cat.name}/>
</div>;
```

The static html is inlined into the web page in a `<template>` element:

```html
<!-- index.html -->
<template id='abc123'>
    <div>
        <h2><!--0--></h2>
        <img>
    </div>
</template>
```

A code segment is generated to replace the JSX in the JavaScript wrapping the provided expressions and integrating with the azoth template service:

```jsx
const cat = {
    name: 'duchess',
    image: 'duchess.png',
}

const card = (() => {
    const [dom, targets] = rendererById('abc123');
    targets[0].textContent = cat.name;
    targets[1].src = cat.image;
    targets[1].alt = cat.name;
})();
```
 
 to produce live DOM node instances at runtime
