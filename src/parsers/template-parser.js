import { Parser } from 'htmlparser2';
import { smartTrimLeft, smartTrimRight } from '../transformers/smart-trim.js';
import voidElements from '../utils/void-elements.js';

export function parse(ast) {

    const { expressions, quasis } = ast.quasi;

    const html = [];

    const elements = [];
    const peek = () => elements.at(-1);

    const closeOpenTag = () => {
        const curEl = peek();
        if(curEl?.inTagOpen) {
            curEl.inTagOpen = false;
            html.push('>');
        }
    };
    
    const handler = {
        onopentagname(name) {
            console.log('onopentagname', name);
            closeOpenTag();
            elements.push({ name, inTagOpen: true });
            html.push(`<${name}`);
        },
        onattribute(name, value, quote) {
            console.log('onattribute', name, value, quote);
            html.push(` ${name}="${value}"`);
        },
        onopentag(name, attributes, isImplied) {
            console.log('onopentag', name, attributes, isImplied);
        },
        ontext(text) {
            if(html.length === 0) {
                text = smartTrimLeft(text);
            }
            
            closeOpenTag();
            
            console.log('ontext >>' + text + '<<');

            html.push(text);
        },
        onclosetag(name, isImplied) {
            console.log('onclosetag', name, isImplied);
            if(isImplied) {                
                html.push(voidElements.has(name) ? '>' : '/>'); 
                elements.pop();
            }
            else {
                closeOpenTag();
                html.push(`</${name}>`);
            }
        },
        oncomment(comment) {
            console.log('oncomment', comment);
        },
    };

    var parser = new Parser(handler, { recognizeSelfClosing: true });

    quasis.forEach((quasi, i) => {
        let html = quasi.value.raw;
        if(i === 0) html = smartTrimLeft(html);
        // last quasi (quasis length is one more than expressions)
        if(i === expressions.length) html = smartTrimRight(html);
        
        parser.write(html);
        
        const expression = expressions[i];
        if(!expression) return;

        parser.write('<text-node/>');
        
    });

    parser.end();

    return { html: html.join('') };
}