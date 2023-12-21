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

```
TemplateDOMLiteral
  expressions: (AzothExpression | Expression) []
    AzothExpression > Expression:
        expression: Node
        inputs:     Identifier[]
  quasis: (TemplateElement | HtmlTemplateElement) []
    HtmlTemplateElement > TemplateElement
        value: { raw, cooked }
        tail: false
        identifier: (AttributeIdentifier | ChildNodeIdentifier)
            AttributeIdentifier > Identifier
                name: attribute name
                bind: 'property' | 'attribute'
                binder: '{' | '#{' | '${' 
            ChildNodeIdentifier > Identifier
                name: '1',
                bind: 'child' | 'element'
                binder: '{' | '#{' | '${' 
```

TBD:

```
AzothTemplateExpression > TaggedTemplateExpression
    tag
    quasi TemplateDOMLiteral
    ???
    
```
    