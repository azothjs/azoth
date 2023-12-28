import { Parser as HtmlParser } from 'htmlparser2';
import voidElements from './void-elements.js';

export function getParser() {
    return new TemplateParser();
}

class TemplateParser {

    // out
    html = '';
    bindings = null; 

    // template context state
    template = null;
    // htmlparser2
    parser = null;
    // carry-over quote information for attr=${interpolator}
    eatQuote = '';

    constructor() {
        this.template = new TemplateContext();
        this.parser = new HtmlParser(this.template, { 
            lowerCaseTags: false,
            lowerCaseAttributeNames: false,
            recognizeSelfClosing: true 
        });
    }

    // test cases at https://regex101.com/r/eJJwAv/1
    static #endQuote = /(?:=)\s*(["|']?)\s*$/; // no flags

    write(text) {
        this.writeText(text);
        const binding = this.template.createBinding();
        if(this.template.nextAttributeBinding) { 
            // finish attribute via quote(s): match ='{, ="{, ={ no match means attr...{
            const match = text.match(TemplateParser.#endQuote);
            if(match) {
                let [, quote] = match;
                // parser will call onattribute
                this.parser.write(this.eatQuote = quote || '""');
            }
            else {
                // for now error
                throw new Error(`Interpolator in attribute not preceded by =, =', or ="`);
            }
        }
    }

    static #startQuote = /^\s*(["|'])/;

    // writeText needs to consider whether the prior .write()  
    // added quotation marks which now need to be removed
    writeText(text) {
        if(text) {
            if(this.eatQuote) {
                const match = TemplateParser.#startQuote.exec(text);
                if(match) {
                    const [fullMatch, quote] = match;
                    if(quote === this.eatQuote) text = text.slice(fullMatch.length);
                }
            }
            this.parser.write(text);
        }
        this.eatQuote = '';
    }

    end(text) {
        this.writeText(text);
        this.parser.end();
            
        this.bindings = this.template.bindings.map(({ 
            element: { name, queryIndex, length }, 
            property, 
            index: childIndex 
        }) => {
            return property ? 
                { queryIndex, name, property } : 
                { queryIndex, name, childIndex, length };
        });
        this.html = this.template.html.flat().join('');

        return { bindings: this.bindings, html: this.html };
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
