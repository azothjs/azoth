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
            childrenLength: 0
        };
    }
}

export function parse(azNode) {
    const { template } = azNode;
    const { quasis, bindings } = template;

    const childNodeReplacement = '<child-node></child-node>';

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

        const curEl = peek();        
        if(curEl.inTagOpen) {
            curEl.inTagOpen = false;
            html.push('>');
        }
    };

    let attribute = null;
    const addAttribute = (attr = attribute) => {
        let { name, value = '', quote = '' } = attr;
        if(value === '') {
            context.attributes.push(` ${name}`);
        }
        else {
            context.attributes.push(` ${name}=${quote}${value}${quote}`);
        }

        if(attr === attribute) attribute = null;
    };

    const handler = {
        onopentagname(name) {
            context.el.childrenLength++; // parent element
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
            context.el.childrenLength++;
            html.push(text);
        },
        onclosetag(name, isImplied) {
            // Close with either >, />, or </tag>
            if(isImplied && !voidElements.has(name)) html.push('/'); 
            if(!isImplied) html.push(`</${name}>`);
            popContext();
        },
        oncomment(comment) {
            html.push(`<!--${comment}-->`);
        },
    };

    var parser = new HtmlParser(handler, { recognizeSelfClosing: true });

    // walk the ast and iterate through by expression and quasi
    let quasi = quasis[0];
    let text = quasi.value.raw;    
    if(text) parser.write(text);
    
    if(quasis.length > 1) {
        if(text) parser.write(text);
        pushHtmlChunk();

        const targets = [];
        for(let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            const { el } = context;

            let queryIndex = targets.lastIndexOf(el);
            if(queryIndex === -1) queryIndex = (targets.push(el) - 1);
            binding.queryIndex = queryIndex;
            // obj ref so childrenLength property will increase if more added
            binding.element = el;
        
            let trimmedQuote = '';

            if(context.inTagOpen) { /* property binder via attribute */
                // Add any prior attribute of this element to html
                if(attribute) addAttribute();

                // This forces the parser to close the current
                // bound attribute as it waits for more attribute
                // than just the equal sign <el attr={val}>
                // TODO: test with quoted attr binding
                let quote = text.at(-1);
                if(quote !== '"' || quote !== "'") quote = '"';    
                parser.write(trimmedQuote = quote);
            
                if(attribute) binding.propertyKey = attribute.name;
                
                // Clear attribute so it does NOT get pushed to
                // html (we are setting as an element property)
                attribute = null;
            }
            else { /* child node (text or block) */
            
                // copy current value as *this* bindings index
                binding.childIndex = el.childrenLength;
                parser.write(childNodeReplacement);
            }

            if(!context.isBound) {
                addAttribute({ name: 'data-bind' });
                context.isBound = true;
            }

            pushHtmlChunk();

            // next template element
            quasi = quasis[i + 1];
            text = quasi.value.raw;
            if(trimmedQuote && text[0] === trimmedQuote) {
                text = text.slice(1);
            }
            else {
            // TODO: Quote match validation errors
            }

            parser.write(text);
        }
    }
    
    parser.end();
    pushHtmlChunk(); // don't forget the last chunk!
    
    template.quasis = chunks.map(chunk => chunk.flat().join(''));

    // TBD:
    // azNode.targets = targets;

    return azNode;
}