import { Parser as HtmlParser } from 'htmlparser2';
import voidElements from './void-elements.js';

// test cases at https://regex101.com/r/2kW0JN
// (note no global flags, remove when copying from regex101)
const startQuote = /^\s*["]/;
const endQuote = /(?:=)\s*(["|'])\s*$/;

export function getParser() {

    const template = new TemplateContext();
    const parser = new HtmlParser(template, { 
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeSelfClosing: true 
    });

    function write(text) {
        writeText(text);
        const binding = template.createBinding();
        if(template.nextAttributeBinding) { 
            // Force parser to call onattribute by writing quotes
            const match = text.match(endQuote) ?? '';
            const quote = match?.length > 1 ? match[1] : '""';
            parser.write(eatQuote = quote);
        }
    }

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

    function end(text) {
        writeText(text);
        parser.end();
            
        return {
            bindings: template.bindings.map(({ 
                element: { name, queryIndex, length }, 
                property, 
                index: childIndex 
            }) => {
                return property ? 
                    { queryIndex, name, property } : 
                    { queryIndex, name, childIndex, length };
            }),
            html: template.html.flat().join('')
        };
    }
    
    return { write, end };
}


class ElementContext {
    attributes = [];
    inTagOpen = true;
    name = '';
    keys = 0;
    length = 0;
    queryIndex = -1;
    isBound = false;

    constructor(name) {
        this.name = name;
    }

    addAttribute(attr) {
        this.attributes.push(attr);
    }
}

class Binding {
    static attributeName = 'data-bind';
    element = null;
    constructor(element) {
        this.element = element;
        this.element.isBound = true;
    }
}

class PropertyBinding extends Binding {
    property = '';
}

class ChildBinding extends Binding {
    index = -1;
    replacement = '';
    constructor(element) {
        super(element);
        this.index = element.length;
        this.replacement = `<!--child[${this.index}]-->`;
    }
}

class TemplateContext {
    html = [];
    stack = [];
    bindings = [];
    targets = [];
    root = null;
    
    // current element context
    element = null;
    // carry-over binding that comes before its own attribute
    nextAttributeBinding = null;

    constructor() {
        this.push('<>');
        this.root = this.element; 
        this.root.inTagOpen = false;
    }

    push(name) {
        const context = new ElementContext(name);
        this.stack.push(this.element = context);
    }

    createBinding() {
        const { targets, element, root } = this;
         // queryIndex is the index of element in querySelectorAll bound els
        // let queryIndex = targets.lastIndexOf(element);
        if(element.queryIndex === -1 && element !== root) {
            element.queryIndex = targets.push(element) - 1;
        }

        let binding = null;
        if(element.inTagOpen) {
            binding = new PropertyBinding(element);
            this.nextAttributeBinding = binding;
        }
        else {
            binding = new ChildBinding(element);
            this.html.push(binding.replacement);
            element.length++;
        }
        this.bindings.push(binding);
    }


    pop(){
        this.stack.pop();
        this.element = this.stack.at(-1);
    }

    onopentagname(name) {
        const parent = this.element;
        parent.length++;
        this.push(name); // new open tag now this.element
        this.html.push(`<${name}`);
    }
        
    onattribute(name, value, quote) {
        const binding = this.nextAttributeBinding;
        this.nextAttributeBinding = null;

        if(binding) {
            binding.property = name;
        }
        else {
            value ??= '';
            const isEmpty = !quote && !value;
            this.element.addAttribute(isEmpty ? ` ${name}` : ` ${name}="${value}"`);
        }
    }
        
    onopentag() {    
        this.element.inTagOpen = false;
        // el.attributes open for further adds & removes
        this.html.push(this.element.attributes, '>');
    }
        
    ontext(text) {            
        this.html.push(text);
        this.element.length++;
    }
        
    onclosetag(name, isImplied) {
        // void, self-closing, tags
        if(!voidElements.has(name)) this.html.push(`</${name}>`);
        if(this.element.isBound) {
            this.onattribute(Binding.attributeName);
        }
        this.pop();
    }
        
    oncomment(comment) {
        this.element.length++;
        this.html.push(`<!--${comment}-->`);
    } 
}
