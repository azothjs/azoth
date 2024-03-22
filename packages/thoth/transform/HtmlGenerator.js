import { Generator } from './GeneratorBase.js';

export class HtmlGenerator extends Generator {

    constructor(config) {
        super();
        this.childReplace = config?.childReplace ?? `<!--0-->`;
    }

    // <>...</>
    JSXFragment(node, state) {
        this.JSXChildren(node, state);
    }

    // >...text{expr}<div></div>...</
    JSXChildren({ children }, state) {
        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            this[child.type](child, state);
        }
    }

    // <div></div>
    JSXElement(node, state) {
        if(node.isComponent) {
            return this.JSXExpressionContainer(node, state);
        }

        state.write('<');
        this[node.openingElement.type](node.openingElement, state);
        state.write('>');

        if(!node.isVoidElement) {
            if(node.closingElement) {
                this.JSXChildren(node, state);
            }

            state.write('</');
            const closingType = node.closingElement?.type || 'JSXClosingElement';
            const closingElement = node.closingElement || node.openingElement;
            this[closingType](closingElement, state);
            state.write('>');
        }
    }

    // <element name="static" value={interpolated} {...spread} > or />
    JSXOpeningElement(node, state) {
        this[node.name.type](node.name, state);
        for(var i = 0; i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            this[attr.type](attr, state);
        }
    }

    // </div>
    JSXClosingElement(node, state) {
        this[node.name.type](node.name, state);
    }

    // div
    JSXIdentifier(node, state) {
        state.write(node.name);
    }

    // <Member.Expression or <foo.bar.qux...
    JSXMemberExpression(node, state) {
        this[node.object.type](node.object, state);
        state.write('.');
        this[node.property.type](node.property, state);
    }

    // attr="value"
    JSXAttribute(node, state) {
        if(node.value?.type === 'JSXExpressionContainer') return;
        state.write(' ');
        this[node.name.type](node.name, state);
        if(node.value) {
            state.write('=');
            this[node.value.type](node.value, state);
        }
    }

    // <namespace:tag or namespace:attr="value"
    JSXNamespacedName(node, state) {
        this[node.namespace.type](node.namespace, state);
        state.write(':');
        this[node.name.type](node.name, state);
    }

    // {...}
    JSXExpressionContainer(node, state) {
        state.write(this.childReplace);
    }

    // ...text...
    JSXText({ value }, state) {
        state.write(value);
    }
}
