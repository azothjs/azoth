# Known Limitations

> Azoth is in active development. Some things crash, some things silently
> drop values, and a few patterns that look reasonable will surprise you.
> This page is the running honest inventory.
>
> Documenting limitations openly is part of the project's culture. The
> principle is the same one we use everywhere: make the current
> understanding explicit, so it can be reviewed, corrected, and improved.
> A foot-gun that lives only in someone's head is a foot-gun that gets
> rediscovered. A foot-gun written down is a candidate for being fixed.
>
> Entries are ordered roughly by how likely you are to hit them. Each
> entry leads with the symptom — what goes wrong — so it's discoverable
> when you're searching for an error message you just got.

---

## JSX comments inside returned JSX can crash

**Status:** Open

**What it looks like:**

```jsx
function Layout() {
    return (
        <div>
            <Left />
            {/* Right side */}
            <Right />
        </div>
    );
}
```

Runtime error: `TypeError: Cannot read properties of undefined (reading 'data')`. In some configurations the same pattern instead renders a stray `"1"` text node between the siblings.

**Why:** The compiler's anchor positioning for dynamic children doesn't account for JSX comment nodes appearing between siblings. When a comment sits next to a dynamic component invocation, the runtime's index into the cloned template's child nodes is off by one (or pointing at nothing).

**Workaround:** Remove `{/* … */}` comments from inside returned JSX. Use a plain JavaScript comment (`//` or `/* … */`) on the line above the JSX statement, or extract the section into a named sub-component when intent isn't obvious.

```jsx
// ✅ Comment outside the JSX expression
function Layout() {
    // Right side
    return (
        <div>
            <Left />
            <Right />
        </div>
    );
}
```

**See also:** [for-llms](for-llms.md) lists this in the stop-and-ask triggers.

---

## Dynamic class binding needs `className`, not `class`

**Status:** Known limitation (workaround documented)

**What it looks like:**

```jsx
// ❌ Value drops silently — rendered HTML has no class attribute
<div class={dynamicClass}>content</div>

// ✅ Static is fine
<div class="card">content</div>

// ✅ Dynamic needs the DOM property name
<div className={dynamicClass}>content</div>
```

**Why:** Dynamic bindings in Azoth set DOM properties, not HTML attributes. `el.className = …` works; `el["class"] = …` does not — `class` is not a writable property name on DOM elements. Static `class="…"` is fine because it goes straight into the HTML template without a runtime binding.

**Workaround:** Use the DOM property name for any dynamic binding:

| Attribute name | DOM property name |
|----------------|-------------------|
| `class`        | `className`       |
| `for`          | `htmlFor`         |
| `readonly`     | `readOnly`        |
| `tabindex`     | `tabIndex`        |

**Future work:** An attribute-to-property translation layer is in progress and would let either name work.

**Linked code:** `packages/valhalla/components.test.tsx` — see the `dynamic class attributes` describe block, which documents both the broken (`class={var}`) and correct (`className={var}`) forms in a snapshot.

**See also:** [attributes-and-properties](attributes-and-properties.md) for the full discussion of the attribute/property split.

---

## SVG presentation attributes can't be dynamically bound

**Status:** Known limitation (workaround documented)

**What it looks like:**

```jsx
// ❌ Value drops silently — rendered SVG has no stroke-dasharray attribute
<circle stroke-dasharray={dashArray} />

// ❌ Same problem for stroke, stroke-width, fill, transform, etc.
<circle stroke={color} stroke-width={width} />
```

**Why:** Azoth's dynamic bindings work via DOM property assignment. SVG presentation attributes (`stroke`, `stroke-width`, `stroke-dasharray`, `stroke-dashoffset`, `fill`, `transform`, and others) are exposed on SVG elements as read-only `SVGAnimated*` objects (e.g. `SVGAnimatedLength`, `SVGAnimatedString`). Assigning to them silently does nothing.

A related case affects geometry properties like `polyline.points` and `path.d` — these are read-only objects (`SVGPointList`, `SVGPathData`) and must be set with `setAttribute()`, not property assignment.

**Workaround:** Bind via the `style` template — `style.cssText` is writable, and CSS understands SVG presentation properties:

```jsx
// ✅ style template works because style.cssText is writable
<circle style={`stroke-dasharray: ${dashArray}; stroke: ${color}`} />
```

Browsers normalize the resulting CSS (e.g. `113 283` becomes `113, 283`) but render identically.

For `points`, `d`, and similar geometry attributes, build the SVG with a class or selector and use `setAttribute` directly:

```jsx
const svg = <svg><polyline class="my-line" /></svg>;
svg.querySelector('.my-line').setAttribute('points', pointsData);
```

**Static SVG attributes are fine** — literal values without `{…}` interpolation go into the HTML template directly.

**Future work:** A compiler change to detect SVG-namespaced elements and emit `setAttribute()` for known-non-property attributes is a candidate fix.

---

## Spread children syntax not supported

**Status:** Known limitation (workaround documented)

**What it looks like:**

```jsx
// ❌ Compiler error
const items = list.map(x => <li>{x}</li>);
<ul>{...items}</ul>
```

**Why:** The `{...expr}` syntax in JSX children position is non-standard. React never officially supported it; some Babel configurations compiled it by coincidence because children become arguments to `createElement`, where spread happens to spread into arguments. Azoth compiles JSX to direct DOM operations, so there is no argument list to spread into.

**Workaround:** Pass the array directly. Arrays-as-children works fine — each element is appended:

```jsx
// ✅ Works
const items = list.map(x => <li>{x}</li>);
<ul>{items}</ul>
```

**See also:** [composition](composition.md) for the full list of value types accepted in `{…}` slots.

---

## Components must return a DOM element

**Status:** Known limitation (planned to change)

**What it looks like:**

```jsx
// ❌ Component returning undefined throws at composition time
function Maybe({ value }) {
    return value && <p>{value}</p>;   // returns undefined when value is falsy
}

// ❌ Same problem — explicit null
function Empty() {
    return null;
}
```

**Why:** Maya's `create()` and composition path expect a DOM node back from a component invocation. There is no current branch for "skip" / "render nothing."

**Workaround:** Move the conditional up into the JSX expression slot of the parent. `{condition && <Child/>}` works inside JSX; the component itself just always returns a node:

```jsx
// ✅ Conditional in the parent's JSX expression slot
function Page({ value }) {
    return (
        <div>
            {value && <Maybe value={value} />}
        </div>
    );
}

// And Maybe itself always returns DOM:
function Maybe({ value }) {
    return <p>{value}</p>;
}
```

**Future work:** Per `TODO.md`, components returning `null` or `undefined` should render nothing rather than throw. Planned change in Maya's compose layer.

---

## Components passing primitives produce weird output

**Status:** Open (under review)

**What it looks like:**

```jsx
const Cat = "bill";
<Cat />     // Writes the string "bill" to DOM
```

**Why:** Azoth's component path doesn't currently constrain what a component-position value can be. Strings flow through as text content; numbers similarly. Properties on a primitive have no obvious meaning, so the behavior degrades silently when props are present.

Note that this is about *variable values*, not literal syntax. `<42 />` isn't valid JSX. The issue is `const X = 42; <X />`.

**Workaround:** Don't put non-function, non-class values in component position. If you want to render a string or number, just interpolate it: `{cat}` instead of `<Cat />`.

**Future work:** Certain value types may be disallowed in component positions as an API tightening, to catch likely errors earlier.

---

## SVG dynamic geometry attributes need `setAttribute`

**Status:** Open

**What it looks like:**

```jsx
// ❌ polyline.points is a read-only SVGPointList — assignment is a no-op
<polyline points={pointsData} />

// ❌ Same for path.d
<path d={pathData} />
```

**Why:** Azoth's compiler emits property assignment for dynamic attributes. SVG elements expose `points`, `d`, `viewBox`, and similar attributes as read-only structured objects, not writable strings.

**Workaround:** Build the SVG statically and call `setAttribute` directly:

```jsx
const svg = <svg><polyline class="my-line" /></svg>;
svg.querySelector('.my-line').setAttribute('points', pointsData);
```

**Future work:** Same proposed fix as the presentation-attribute case — detect SVG namespace in Thoth and emit `setAttribute()` calls instead of property assignment for known-non-property attributes.

---

## Historical / now fixed

These entries describe behaviors that *were* bugs and have been fixed. They're recorded here because older code may still contain defensive workarounds, and the symptoms remain searchable.

### Null props on `<Component/>` invocation

**Status:** Fixed (commit `330dd35`)

Previously, `<Card>content</Card>` invoked with no attributes passed `null` instead of `{}` as the props argument, which broke destructuring:

```jsx
// Older versions:
const Card = ({ class: className }, slottable) => …;
<Card>…</Card>     // TypeError: Cannot destructure property 'class' of 'null'
```

`<Component/>` and `<Component foo={bar}/>` now both always pass an object. Destructuring with defaults is safe.

If you see `props?.x` defensive access in older code, that's the reason — no longer necessary.

**Linked code:** `packages/valhalla/components.test.tsx` — `component invocation` describe block snapshots the `{}` vs `undefined` distinction across JSX and direct-call forms.

---

### Boolean props on custom components

**Status:** Fixed

Previously, the boolean shorthand on a custom component crashed Thoth with `Cannot read properties of null (reading 'type')`:

```jsx
<MyComponent flag />     // crashed
```

The compiler now treats a missing value on a component prop as a synthetic `true` literal, so `<MyComponent flag />` is equivalent to `<MyComponent flag={true} />`, matching JSX/React semantics. Native HTML elements were never affected — they used a separate code path.

---

### Template `targetKey` collision

**Status:** Fixed

Earlier compiler versions hashed the template's `tMap` using `Array.join(';')`, which flattened nested arrays. `[0]` and `[[0]]` produced the same hash, even though they describe different binding targets (a property on a child element vs. child content on the root element).

The symptom was a runtime crash — `TypeError: Cannot read properties of undefined (reading 'data')` — when two templates with structurally different `tMap`s happened to collide and the vite-plugin dedup reused the wrong target function.

The fix switched to `JSON.stringify(tMap)` for hashing, which preserves structure. See the `targetKey must distinguish root vs child element bindings` test in `packages/thoth/compiler.test.js`.

---

## Reporting new limitations

If you hit a behavior that surprised you and isn't on this page, that's signal worth surfacing. Two ways to capture it:

1. **Reproduce in `packages/valhalla/sandbox.test.tsx`** — minimal JSX that demonstrates the issue, with a snapshot of the actual (wrong) output. Saves anyone investigating from re-deriving the repro.
2. **Add an entry here** — even a stub with status `Open` is more useful than nothing. The entry shape above is the template.

The honest inventory is the working surface. Don't hesitate to add to it.

---

## See also

- [For LLMs](for-llms.md) — terminology discipline and stop-and-ask triggers
- [Components](components.md) — function and class forms, props and slottable; includes the historical note on null props
- [Attributes and properties](attributes-and-properties.md) — the static vs dynamic split, full class/className discussion
- [Composition](composition.md) — what `{…}` slots accept
- [JSX as DOM](jsx-as-dom.md) — the foundation that explains why DOM-property names matter
