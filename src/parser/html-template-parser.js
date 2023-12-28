import { Parser as HtmlParser } from 'htmlparser2';
import voidElements from './void-elements.js';

// test cases at https://regex101.com/r/2kW0JN
// (note no global flags, remove when copying from regex101)
const startQuote = /^\s*["]/;
const endQuote = /(?:=)\s*(["|'])\s*$/;

export function getParser() {

    const templateContext = new TemplateContext();
    const parser = new HtmlParser(templateContext, { 
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeSelfClosing: true 
    });

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

        const { element, root } = templateContext;
       
        const binding = templateContext.createBinding();
        /* property binder via attribute */
        if(binding.type === 'property') { 
            // Force the attribute to close properly by 
            // ensuring full set of matching quotes happen
            const match = text.match(endQuote) ?? '';
            const quote = match?.length > 1 ? match[1] : '""';
            parser.write(eatQuote = quote);
        }
    }

    return {
        write,
        end(text) {
            writeText(text);
            parser.end();
            
            return {
                bindings: templateContext.bindings.map(({ 
                    element: { name, queryIndex, length }, 
                    property, 
                    childIndex 
                }) => {
                    return property ? 
                        { queryIndex, name, property } : 
                        { queryIndex, name, childIndex, length };
                }),
                // Originally placed into quasi chunks:
                // quasis: chunks.map(chunk => chunk.flat().join(''))
                html: templateContext.html.flat().join('')
            };
        }
    };

}


class ElementContext {
    inTagOpen = true;
    attributes = [];
    bindings = [];
    waiting = null;
    name = '';
    keys = 0;
    length = 0;
    queryIndex = -1;

    constructor(name) {
        this.name = name;
    }
}

class Binding {
    
}

class TemplateContext {
    html = [];
    stack = [];
    bindings = [];
    targets = [];
    root = null;
    
    // context state
    element = null;
    propertyBinding = null;

    constructor() {
        this.root = this.element = this.push('<>');
        this.root.inTagOpen = false;
    }

    push(name) {
        const ctx = new ElementContext(name);
        this.stack.push(this.element = ctx);
        return ctx;
    }

    createBinding() {
        const { targets, element, root } = this;
         // queryIndex is the index of element in querySelectorAll bound els
        // let queryIndex = targets.lastIndexOf(element);
        if(element.queryIndex === -1 && element !== root) {
            element.queryIndex = targets.push(element) - 1;
        }
        const binding = { element };
        element.bindings.push(binding);
        
        this.bindings.push(binding);

        /* property binder via attribute */
        if(element.inTagOpen) {
            this.addPropertyBinder(binding);
        }
        else {
            this.addChildBinder(binding);
        }


        return binding;
    }

    addChildBinder(binding) {
        // copy element value by assigning to binding index,
        // this.element.length will increase as more children added
        binding.type = 'child';
        const index = binding.childIndex = this.element.length;
        const replacement = `<!--child[${index}]-->`; // TODO: externalize replacement = i => `...`
        this.html.push(replacement);
        this.element.length++;
    }

    addPropertyBinder(binding) {
        const { element } = this;
        binding.attributeIndex = element.attributes.length;
        binding.type = 'property';
        this.propertyBinding = binding;
    }

    pop(){
        this.stack.pop();
        this.element = this.stack.at(-1);
    }

    onopentagname(name) {
        this.element.length++; // parent childNodes
        this.push(name);
        this.html.push(`<${name}`);
    }
        
    onattribute(name, value, quote) {
        const binding = this.propertyBinding;
        this.propertyBinding = null;
        if(binding) binding.property = name;

        value ??= '';
        const isEmpty = !quote && !value;
        this.element.attributes.push(isEmpty ? ` ${name}` : ` ${name}="${value}"`);
    }
        
    onopentag() {    
        const { element } = this;       
        element.inTagOpen = false;
        this.html.push(element.attributes); // open for further adds & removes
        this.html.push('>');
    }
        
    ontext(text) {            
        this.element.length++;
        this.html.push(text);
    }
        
    onclosetag(name, isImplied) {
        const { element: { bindings, attributes } } = this;
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
        this.element.length++;
        this.html.push(`<!--${comment}-->`);
    }
        
}
