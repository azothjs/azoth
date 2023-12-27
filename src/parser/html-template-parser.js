import { Parser as HtmlParser } from 'htmlparser2';
import voidElements from './void-elements.js';

// test cases at https://regex101.com/r/2kW0JN
// (note no global flags, remove when copying from regex101)
const startQuote = /^\s*["]/;
const endQuote = /(?:=)\s*(["|'])\s*$/;

export function getParser() {

    const context = new TemplateContext();
    const parser = new HtmlParser(context, { 
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeSelfClosing: true 
    });

    const targets = [];

    // writeText needs to consider whether the prior .write()  
    // added quotation marks which now need to be removed
    let eatQuote = '';
    function writeText(text) {
        if(text) {
            if(eatQuote && text[0] === eatQuote) text = text.slice(1);
            parser.write(text);
        }
        eatQuote = '';
    }

    function write(text) {
        writeText(text);

        const { current, root } = context;
        const { el } = current;
        // queryIndex is the index of element in querySelectorAll bound els
        let queryIndex = targets.lastIndexOf(el);
        if(queryIndex === -1 && current !== root) queryIndex = (targets.push(el) - 1);

        const binding = { queryIndex, element: el, };

        /* property binder via attribute */
        if(current.inTagOpen) { 
            context.addPropertyBinder(binding);

            // Force the attribute to close properly by 
            // ensuring full set of matching quotes happen
            const match = text.match(endQuote) ?? '';
            const quote = match?.length > 1 ? match[1] : '""';
            parser.write(eatQuote = quote);
        }
        /* child node (text or block) */
        else { 
            context.addChildBinder(binding);
        }
    }

    return {
        write,
        end(text) {
            writeText(text);
            parser.end();
            
            return {
                bindings: context.bindings.map(({ 
                    queryIndex, 
                    element: { name, length }, 
                    property, 
                    childIndex 
                }) => {
                    return property ? 
                        { queryIndex, name, property } : 
                        { queryIndex, name, childIndex, length };
                }),
                // Originally placed into quasi chunks:
                // quasis: chunks.map(chunk => chunk.flat().join(''))
                html: context.html.flat().join('')
            };
        }
    };

}


class ElementContext {
    el = null;
    inTagOpen = true;
    attributes = [];
    bindings = [];
    waiting = null;

    constructor(name) {
        this.el = {
            name,
            keys: 0,
            length: 0
        };
    }
}

class TemplateContext {
    html = [];
    stack = [];
    bindings = [];
    
    propertyBinding = null;
    root = null;
    current = null;

    constructor() {
        this.root = this.current = this.push('<>');
        this.root.inTagOpen = false;
    }

    push(name) {
        const ctx = new ElementContext(name);
        this.stack.push(this.current = ctx);
        return ctx;
    }

    addChildBinder(binding) {
        this.bindings.push(binding);
        this.current.bindings.push(binding);
        const { el } = this.current;
        // copy current value by assigning to binding index,
        // el.length will increase as more children added
        const index = binding.childIndex = el.length;
        const replacement = `<!--child[${index}]-->`; // TODO: externalize replacement = i => `...`
        this.html.push(replacement);
        el.length++;
    }

    addPropertyBinder(binding) {
        this.bindings.push(binding);
        this.current.bindings.push(binding);
        const { current } = this;
        binding.attributeIndex = current.attributes.length;
        this.propertyBinding = binding;
    }

    pop(){
        this.stack.pop();
        this.current = this.stack.at(-1);
    }

    onopentagname(name) {
        this.current.el.length++; // parent childNodes
        this.push(name);
        this.html.push(`<${name}`);
    }
        
    onattribute(name, value, quote) {
        const binding = this.propertyBinding;
        this.propertyBinding = null;
        if(binding) binding.property = name;

        value ??= '';
        const isEmpty = !quote && !value;
        this.current.attributes.push(isEmpty ? ` ${name}` : ` ${name}="${value}"`);
    }
        
    onopentag() {    
        const { current } = this;       
        current.inTagOpen = false;
        this.html.push(current.attributes); // open for further adds & removes
        this.html.push('>');
    }
        
    ontext(text) {            
        this.current.el.length++;
        this.html.push(text);
    }
        
    onclosetag(name, isImplied) {
        const { current: { bindings, attributes } } = this;
        // void, self-closing, tags
        if(!voidElements.has(name)) this.html.push(`</${name}>`);

        if(bindings.length) {
            for(let i = 0; i < bindings.length; i++) {
                attributes[bindings[i].attributeIndex] = '';
            }
            this.onattribute('data-bind');
        }

        this.pop();
    }
        
    oncomment(comment) {
        this.current.el.length++;
        this.html.push(`<!--${comment}-->`);
    }
        
}
