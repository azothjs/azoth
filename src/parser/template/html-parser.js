import { Parser as HtmlParser } from 'htmlparser2';
import voidElements from '../void-elements.js';
import { LAST_QUOTE, NEXT_QUOTE, DEV_TRIM } from './regex.js';
import { html, find } from 'property-information';
import { getLineInfo } from 'acorn';
import { findInfo } from './find-info.js';

export class TemplateParser {
    // final state after .end()
    html = '';
    binders = []; 
    boundElements = null;
    rootType = 'fragment';

    // template context state, implements handler for htmlparser2
    template = null;
    // htmlparser2 instance
    parser = null;
    // current TemplateElement AST Node
    templateElement = null;
    // current interpolator
    interpolator = null;
    // carry-over quote information for attr=${interpolator}
    eatQuote = '';

    constructor() {
        this.template = new TemplateContext();
        this.parser = new HtmlParser(this.template, { 
            lowerCaseTags: false,
            lowerCaseAttributeNames: false,
            recognizeSelfClosing: true 
        });
        this.template.parser = this.parser;
    }

    writeTemplatePart(templateElement, interpolator) {
        this.templateElement = templateElement;
        this.interpolator = interpolator;
        return this.write(templateElement.value.raw);
    }
    
    write(text) {
        if(this.parser.ended) {
            throw new Error('Cannot call parser.write() after parser.end()');
        }
        this.writeText(text);
        const binder = this.template.createBinder(this.templateElement, this.interpolator);
        if(this.template.nextAttributeBinder) { 
            // finish attribute via quote(s): match ='{, ="{, ={ no match means attr...{
            const match = text.match(LAST_QUOTE);
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
        else {
            // TODO: edge case like <input{...} should throw
        }
    }

    writeText(text) {
        if(text) {
            // console.log('before write', this.parser.startIndex, this.parser.openTagStart);

            // remove equivalent quotation marks added by prior parser.write()
            if(this.eatQuote) {
                const match = text.match(NEXT_QUOTE);
                if(match) {
                    const [fullMatch, quote] = match;
                    if(quote === this.eatQuote) text = text.slice(fullMatch.length);
                }
            }
            this.parser.write(text);
            // console.log('after write', this.parser.startIndex);
        }
        this.eatQuote = '';
    }

    endTemplate(templateElement) {
        if(!templateElement.tail) {
            throw new Error(`Cannot call endTemplate with non-tail TemplateElement`);
        }
        // tail cannot be bound
        this.templateElement = null;
        this.interpolator = null;
        this.end(templateElement.value.raw);
    }

    end(text) {
        if(this.parser.ended) {
            if(text) {
                throw new Error('Cannot call parser.end with text if parser.end has already been called.');
            }
        }
        else {
            this.writeText(text);
            this.parser.end();

            const { hasElements, boundElements, root } = this.template;
            const bound = [...boundElements].sort((a, b) => a.order - b.order);
            const { length } = bound;
            for(let i = 0; i < length; i++) {
                bound[i].queryIndex = i;
            }

            this.elements = bound
                .map(e => e.toNode());
            
            this.binders = this.template.binders
                .map(b => b.toNode());

            this.html = this.template.html
                .flat()
                .join('')
                .replace(DEV_TRIM, '');

            // default is "fragment"
            if(root.length === 1) {
                if(!hasElements) {
                    this.rootType = 'text';
                }
                else if(!root.isBound) {
                    this.rootType = 'element';
                }
            }
        }

        const { binders, html, elements, rootType } = this;
        return { binders, html, elements, rootType };
    }   
}

class TemplateContext {
    // accumulated html array of strings and arrays
    html = [];
    // Does this html contain _any_ elements?
    hasElements = false;
    
    // template binders
    binders = [];
    // unique set of bound elements of the template
    boundElements = new Set();
    // context stack for current element
    stack = [];
    // fragment "root" of stack
    root = null;
    // current element context
    element = null;
    // element count used to track element order
    elementCount = 0;
    
    
    // carry-over binder that comes before its own attribute
    nextAttributeBinder = null;

    constructor() {
        this.push('<>');
        this.root = this.element; 
        this.root.inTagOpen = false;
    }

    push(name, tagStart) {
        const context = new ElementContext(name, this.elementCount++, tagStart);
        this.stack.push(this.element = context);
        if(name !== '<>') this.hasElements = true;
    }

    createBinder(templateElement, interpolator) {
        const { element, root } = this;
        // if(templateElement?.loc) {
        //     // console.log(templateElement.type, templateElement?.loc, templateElement?.start, templateElement?.end);
        //     // console.log(interpolator.type, interpolator?.loc);
        // }

        let binder = null;
        if(element.inTagOpen) {
            binder = new PropertyBinder(element, interpolator);
            this.nextAttributeBinder = binder;
        }
        else {
            binder = new ChildBinder(element, interpolator);
            this.html.push(binder.replacement);
            element.length++;
        }
        this.binders.push(binder);
        return binder;
    }

    pop(){
        this.stack.pop();
        this.element = this.stack.at(-1);
    }

    onopentagname(name) {
        const parent = this.element;
        parent.length++;

        // makes this open tag new this.element context
        this.push(name, this.parser.openTagStart); 
        this.html.push(`<${name}`);
    }
        
    onattribute(name, value, quote) {
        const binder = this.nextAttributeBinder;
        this.nextAttributeBinder = null;

        if(binder) {
            // TODO: source map location
            binder.setProperty(name);
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

        const { element, root, boundElements } = this;
        if(element.isBound) {
            this.onattribute(Binder.queryAttributeName);
            if(!boundElements.has(element)) {
                boundElements.add(element);
            }
        }

        this.pop();
    }
        
    oncomment(comment) {
        this.element.length++;
        this.html.push(`<!--${comment}-->`);
    }
}

class ElementContext {
    type = 'DomTemplateElement';
    attributes = [];
    inTagOpen = true;
    name = '';
    length = 0;
    queryIndex = -1;
    isBound = false;
    order = -1;
    position = null;

    constructor(name, order, tagStart, position) {
        this.name = name;
        this.order = order;
        this.start = tagStart + 1;
        this.end = this.start + this.name.length;
        this.range = [this.start, this.end];
        this.position = position ?? null;
    }

    addAttribute(attr) {
        this.attributes.push(attr);
    }

    toNode() {
        const { type, name, length, queryIndex, start, end, range } = this;
        // TODO: source map location
        return { type, name, length, queryIndex, start, end, range };
    }
}

class Binder {
    static queryAttributeName = 'data-bind';
    element = null;
    interpolator = null;
    type = '';
    start = -1;
    end = -1;
    range = null;

    constructor(element, interpolator) {
        this.element = element;
        this.element.isBound = true;
        this.type = this.constructor.name;
        if(interpolator) {
            this.interpolator = interpolator;
            const { start, end, range } = interpolator;
            this.start = start;
            this.end = end;
            this.range = range ?? [start, end];
        }
    }
}

class PropertyBinder extends Binder {
    property = '';
    attribute = '';
    raw = '';

    setProperty(value) {
        const { property, attribute } = findInfo(value);
        this.raw = value;
        this.property = property;
        this.attribute = attribute;
    }

    toNode() {
        const { type, element: { queryIndex }, interpolator, property, attribute, raw, start, end, range } = this;
        return { 
            type,
            queryIndex,
            interpolator,
            // TODO: identity node with location
            name: raw, 
            property, 
            attribute,
            start, end, range,
        };
    }
}

class ChildBinder extends Binder {
    index = -1;
    replacement = '';
    constructor(element, interpolator) {
        super(element, interpolator);
        this.index = element.length;
        // this.replacement = `<!--child[${this.index}]-->`;
        this.replacement = `<text-node></text-node>`;
    }

    toNode() {
        const { type, element, interpolator, index, replacement, start, end, range } = this;
        const { queryIndex, length } = element;
        return { 
            type,
            queryIndex,
            interpolator,
            index,
            length,
            replacement, 
            start, end, range
        };
    }
}
