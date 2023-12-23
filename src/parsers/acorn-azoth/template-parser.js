import { Parser as HtmlParser } from 'htmlparser2';
import voidElements from '../../utils/void-elements.js';

class ElementContext {
    el = null;
    inTagOpen = true;
    attributes = [];
    isBound = false;

    constructor(name) {
        this.el = {
            name,
            length: 0
        };
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
    const peek = () => contextStack.at(-1); 
    const pushContext = (name) => {
        const ctx = new ElementContext(name);
        contextStack.push(ctx);
        context = ctx; 
    };
    const popContext = () => {
        contextStack.pop();
        context = contextStack.at(-1);
    };
    
    // add a root context for parsing ease
    pushContext('<>');
    context.inTagOpen = false;


    // html builder for current template element
    let chunks = [];
    let html = [];
    const pushHtmlChunk = () => {
        const chunk = html;
        html = [];
        if(chunk.length) chunks.push(chunk);
        return chunk;
    };

    const closeOpenTag = () => {
        if(attribute) addAttribute(attribute);
        
        if(context.inTagOpen) {
            context.inTagOpen = false;
            html.push('>');
        }
 
    };

    let attribute = null;
    const addAttribute = (attr = attribute) => {
        let { name, value, quote } = attr;
        quote ??= '';
        value ??= '';
        if(quote || value) {
            context.attributes.push(` ${name}=${quote}${value}${quote}`);
        }
        else {
            context.attributes.push(` ${name}`);
        }

        if(attr === attribute) attribute = null;
    };

    const handler = {
        onopentagname(name) {
            context.el.length++; // parent element
            pushContext(name);
            html.push(`<${name}`);
            html.push(context.attributes);
        },
        onattribute(name, value, quote) {
            if(attribute) addAttribute();
            attribute = { name, value, quote };
        },
        onopentag: closeOpenTag,
        ontext(text) {            
            context.el.length++;
            html.push(text);
        },
        onclosetag(name, isImplied) {
            // void, self-closing, normal ??? 
            // TODO: if(isImplied && !config.allowSelfClosing)..warning?
            // maybe only for custom elements, throw or ignore?
            if(!voidElements.has(name)) html.push(`</${name}>`);
            if(context.isBound) addAttribute({ name: 'data-bind' });
            popContext();
        },
        oncomment(comment) {
            context.el.length++;
            html.push(`<!--${comment}-->`);
        },
    };

    const parser = new HtmlParser(handler, { 
        lowerCaseTags: false,
        recognizeSelfClosing: true 
    });

    let length = 0;
    const bindings = [];
    const targets = [];

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
        pushHtmlChunk();

        const { el } = context;
        // queryIndex is the index of element in querySelectorAll bound els
        let queryIndex = targets.lastIndexOf(el);
        if(queryIndex === -1) queryIndex = (targets.push(el) - 1);

        // el obj ref - length property will increase if more added
        const binding = { queryIndex, element: el, };
        bindings.push(binding);
        context.isBound = true;

        if(context.inTagOpen) { /* property binder via attribute */
            // Add any prior attribute of this element to html
            // (only missing on first attribute)
            if(attribute) addAttribute();

            // figure out if there was an opening quote
            const match = text.match(endQuote) ?? '';
            if(match && match.length > 1) {
                parser.write(eatQuote = match[1]);
            } 
            else {
                parser.write('""');

            }
        
            if(attribute) binding.property = attribute.name;
            
            // Clear attribute so it does NOT get pushed to
            // html (we are setting as an element property)
            attribute = null;
        }
        else { /* child node (text or block) */
            // copy current value as *this* bindings index
            const index = binding.index = el.length;
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
            pushHtmlChunk(); 
            
            return {
                bindings: bindings.map(({ queryIndex, element: { name, length }, property, index }) => {
                    return property ? { queryIndex, name, property } : { queryIndex, name, index, length };
                }),
                quasis: chunks.map(chunk => chunk.flat().join(''))
            };
        }
    };

}
