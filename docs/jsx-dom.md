# JSX _is_ DOM


JSX in Azoth represents literal DOM nodes. There is no renderer required and JSX can be used directly:

```jsx
document.body.append(<p>Hello World</p>)
```

This also means that in additional to traditional templating use, it can also be used imperatively


## Templates

- Interpolation (mixing in JavaScript values and expressions)
- Composing with JavaScript
- Composing with Elements (custom elements and components)

### Interpolation

Interpolation (mixing in JavaScript values and expression) works as expected for element properties and child node values:

```jsx
const animal = { name: 'felix', type: 'cat' };
const p = <p className={animal.type}>{animal.name}</p>;
// use p
```



### Composing with JavaScript

Any type of declarative or imperative 

```jsx
 



