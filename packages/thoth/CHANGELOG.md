# @azothjs/thoth

## 0.4.5

### Patch Changes

- JSX handling fixes:
  - Always pass `{}` for no-attribute component invocations
  - Skip JSX comments in HTML template generation
  - Resolve targetKey collision via JSON.stringify for tMap
  - Handle boolean props without values in custom components
  - Allow digits in component-identification regex
