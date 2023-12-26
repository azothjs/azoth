Azoth
===

## Syntax

Type:                | TemplateLiteral        | TemplateDomLiteral      | AzothTaggedTemplate
---                  |---:                    |---:                     |--:
template syntax      | <code>\`</code>        | <code>#\`</code>        | `_#`
interpolator syntax  | `${...}`               | `{...}`, `#{...}`       | `~identity`
interpolator value   | `String(...)`          | `{`: smart              |
&nbsp;               | &nbsp;                 | `#{`: `Node \| fn \| Promise \| []`              |
returns              | `string`               | `Node`                  | `function` `(...p?) => Node` 


syntax              | interpolator syntax 
---:                |---:                 
 <code>\`</code>    | `${...}`            
 <code>#\`</code>   | `{...}`             
 &nbsp;             | `#{...}`            
 <code>_#\`</code>  | `~identity`         

## AST

```js
DomTemplateLiteral
    expressions: (AzothExpression | Expression) []
        AzothExpression:
            expression: Node
            inputs:     Identifier[]
    quasis: [
        TemplateElement
            value: { raw, cooked }
            tail: false
    ]
    bindings: DomBinding []
        DomElementBinding
            name: 'tag' | '<>'
            queryIndex: 1
            property: 
                NumericLiteral (child)
                    value: 2
                    extra: { raw, rawValue }
                Identifier
                    name: 'class' 
            interpolator: InterpolatedExpression
                name: '{' | '#{' | '${'
```

## TBD

### reactivity

```js
AzothExpression:
    expression: Node
    inputs:     Identifier[]
```

```js
AzothTemplateExpression (vs TaggedTemplateExpression)
    tag
    quasi TemplateDOMLiteral
    ???
    
```

### call expression

maybe for set attribute?

```js
    CallExpression (attribute)
        callee: MemberExpression
            object: Identity
                name: 'tag'
            computed: false
            property:
                StringLiteral
                    value: 'value'
                    extra: { raw, rawValue }
```
    
string literal for property? vs identifier

```js
property: 
    StringLiteral
        value: 'value'
        extra: { raw, rawValue }
```