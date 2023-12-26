import { Parser as HtmlParser } from 'htmlparser2';
import voidElements from './void-elements.js';

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

class ContextStack {
    stack = [];
    current = null;

    constructor() {
        this.current = this.pushContext('<>');
        this.current.inTagOpen = false;
    }

    pushContext(name) {
        const ctx = new ElementContext(name);
        this.stack.push(this.current = ctx);
    }

    popContext(){
        this.stack.pop();
        this.current = this.stack.at(-1);
    }
}

// test cases at https://regex101.com/r/2kW0JN
// (note no global flags, remove when copying from regex101)
const startQuote = /^\s*["]/;
const endQuote = /(?:=)\s*(["|'])\s*$/;

export function getParser() {

    const replaceChildNodeWith = index => `<!--child[${index}]-->`;

    // element context
    let context = null;
    const contextStack = [];

    // extend Array
    const pushContext = (name) => {
        const ctx = new ElementContext(name);
        contextStack.push(ctx);
        context = ctx; 
    };
    const popContext = () => {
        contextStack.pop();
        context = contextStack.at(-1);
    };
    
    // constructor:
    // add a root context for parsing ease
    pushContext('<>');
    context.inTagOpen = false;

    let html = [];
    const handler = {
        onopentagname(name) {
            context.el.length++; // parent childNodes
            pushContext(name);
            html.push(`<${name}`);
        },
        onattribute(name, value, quote) {
            const binding = context.waiting;
            context.waiting = null;
            if(binding) binding.property = name;

            value ??= '';
            const isEmpty = !quote && !value;
            context.attributes.push(isEmpty ? ` ${name}` : ` ${name}="${value}"`);
        },
        onopentag() {           
            context.inTagOpen = false;
            html.push(context.attributes); // open for further adds & removes
            html.push('>');
        },
        ontext(text) {            
            context.el.length++;
            html.push(text);
        },
        onclosetag(name, isImplied) {
            // void, self-closing, tags
            if(!voidElements.has(name)) html.push(`</${name}>`);

            if(context.bindings.length) {
                const { bindings, attributes } = context;
                for(let i = 0; i < bindings.length; i++) {
                    attributes[bindings[i].attributeIndex] = '';
                }
                handler.onattribute('data-bind');
            }

            popContext();
        },
        oncomment(comment) {
            context.el.length++;
            html.push(`<!--${comment}-->`);
        },
    };

    const parser = new HtmlParser(handler, { 
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeSelfClosing: true 
    });

    let length = 0;
    const targets = [];
    const templateBindings = [];

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

        const { el } = context;
        // queryIndex is the index of element in querySelectorAll bound els
        let queryIndex = targets.lastIndexOf(el);
        if(queryIndex === -1) queryIndex = (targets.push(el) - 1);

        // el obj ref - length property will increase if more added
        const binding = { queryIndex, element: el, };
        context.bindings.push(binding);
        templateBindings.push(binding); // ?

        /* property binder via attribute */
        if(context.inTagOpen) { 
            binding.attributeIndex = context.attributes.length;
            context.waiting = binding;
            // force the onattribute to by full set of matching quotes
            const match = text.match(endQuote) ?? '';
            const quote = match?.length > 1 ? match[1] : '""';
            parser.write(eatQuote = quote);
        }
        /* child node (text or block) */
        else { 
            // copy current value by assigning to binding index,
            // el.length will increase as more children added
            const index = binding.childIndex = el.length;
            const replacement = replaceChildNodeWith(index);
            html.push(replacement);
            el.length++;
        }
    }

    return {
        write,
        end(text) {
            writeText(text);
            parser.end();

            return {
                bindings: templateBindings.map(({ queryIndex, element: { name, length }, property, index }) => {
                    return property ? { queryIndex, name, property } : { queryIndex, name, index, length };
                }),
                // quasis: chunks.map(chunk => chunk.flat().join(''))
                quasis: html.flat().join('')
            };
        }
    };

}
