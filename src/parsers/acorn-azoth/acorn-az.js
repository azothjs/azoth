/* eslint-disable no-fallthrough */
// Acorn source uses intentional fallthrough in switch/case

// Writing this plugin leaned on the acorn-jsx example.
// Plugin structure and acorn extending pretty much the same.
// Heavy refactoring on code structure, within the constraints
// of being an acorn parser extension and favoring some of
// it's existing style and paradigm.
//
// https://github.com/acornjs/acorn-jsx/blob/main/index.js

import { getLineInfo } from 'acorn';
import { getAzTokens } from './tokens';

export default function acornAzFactoryConfig(options) {
    options = options ?? {};
    return function acornAzFactory(Parser) {
        return plugin(options, Parser);
    };
}

const DEFAULT_SIGIL = '_';

function plugin(options, Parser) {
    const SIGIL = (options?.sigil ?? '_')[0];
    const SIGIL_CODE = SIGIL.charCodeAt(0);
    
    const acorn = Parser.acorn;
    const acornAz = getAzTokens(acorn);

    const tt = acorn.tokTypes;
    const { sigilQuote, hashBraceL } = acornAz.tokTypes;
    const { az_tmpl } = acornAz.tokContexts;

    const isNewLine = acorn.isNewLine;

    const lBraces = new Set([hashBraceL, tt.dollarBraceL, tt.braceL]);

    const TMPL_END = {
        '96': tt.backQuote,
        '36': tt.dollarBraceL,
        '123': tt.braceL,
        '35': hashBraceL,
    };
     
    return class extends Parser {
        // Expose azoth `tokTypes` and `tokContexts` to other plugins.
        // Cause that's what the jsx plugin did, ;)
        static get acornAz() {
            return acornAz;
        }

        /* Tokenization Methods */

        static tokenizer(input, options) {
            return new this(options, input);
        }

        readToken(code) {
            // Azoth template : SIGIL`
            if(code === SIGIL_CODE && this.input.charCodeAt(this.pos + 1) === 96) {
                this.pos += 2;
                return this.finishToken(sigilQuote);
            }
            super.readToken(code);
        }

        readTmplEnd(code) {
            const token = TMPL_END[code];
            if(!token) {
                throw `Unexpected character "${String.fromCharCode(code)}" (${code}) in azothAcorn parser.readTmplEnd. This shouldn't happen.`;
            }
           
            this.pos += token.label.length;
            return this.finishToken(token);
        }

        // These are copied and modified methods from base acorn parser.
        // Acorn is  mindful of call stack size and excessive function calling
        // as these add up in the hot path of a speed optimized parser.  
        readTmplToken() {
            let out = '', chunkStart = this.pos;
            for(;;) {
                if(this.pos >= this.input.length) this.raise(this.start, 'Unterminated template');
                let ch = this.input.charCodeAt(this.pos);

                /* Method change start */

                // This is the changed code for possible end to template quasi token.
                // One strange thing to note is that this code will be visited twice:
                // 1. The token is found trying to read more of the string,
                // so we need to finishToken on tt.template (quasi string)
                // 2. The token is found at the start of trying to ready a string,
                // so we need to finish that token to the output.
                // That logic 

                const isBackQuote = ch === 96; // `
                const isDollar = ch === 36; // $
                const isHash = ch === 35; // #
                const isBraceL = ch === 123; // {

                if(isBackQuote || isDollar || isHash || isBraceL) {
                    const isAzTmpl = this.curContext() === az_tmpl;
                    const hasBraceLNext = (isHash || isDollar) && this.input.charCodeAt(this.pos + 1) === 123; // {
                    const isDollarBraceL = isDollar && hasBraceLNext; // ${
                    const isHashBraceL = isHash && hasBraceLNext; // #{

                    // Azoth interpolator found in normal template. 
                    if(!isAzTmpl && (isHashBraceL || (isBraceL && this.input.charCodeAt(this.pos - 1) === 35))) {
                        // If the DX works and no syntax highlight we can prob skip.
                        // Still would need the if because it prevents the else code and
                        // allows for continued execution
                        let { line, column } = getLineInfo(this.input, this.pos);
                        let warning = `azoth interpolator ${isHash ? '#' : ''}{...} `;
                        warning += 'found in non-azoth template at ';
                        warning += `(${line}:${column})`;
                        
                        // TODO: how would this work in vite DX?
                        if(!import.meta.env.TEST) {
                            // eslint-disable-next-line no-console
                            console.warn(warning);
                        }    
                    }
                    // handle end via ` (overall template) or start of interpolator
                    else if(isBackQuote || isDollarBraceL || (isAzTmpl && (isBraceL || isHashBraceL))) { // ` { ${ #{
                        // Means we already finished the template quasi token and restarted
                        // via readTmplToken(). We test for this by checking position is
                        // still at start of token and a template quasi has been started.
                        // (keep in mind string quasi in template literal still exists even 
                        // if empty string)
                        if(this.pos === this.start && (this.type === tt.template || this.type === tt.invalidTemplate)) {
                            // finish boundary token (backQuote or interpolator)
                            return this.readTmplEnd(ch);
                        }

                        // otherwise, finish template token:
                        out += this.input.slice(chunkStart, this.pos);
                        return this.finishToken(tt.template, out);
                    }

                    // be aware if conditions not met, things continue below
                }
                /* Method change end */

                if(ch === 92) { // '\'
                    out += this.input.slice(chunkStart, this.pos);
                    out += this.readEscapedChar(true);
                    chunkStart = this.pos;
                } else if(isNewLine(ch)) {
                    out += this.input.slice(chunkStart, this.pos);
                    ++this.pos;
                    switch (ch) {
                        case 13:
                            if(this.input.charCodeAt(this.pos) === 10) ++this.pos;
                        case 10:
                            out += '\n';
                            break;
                        default:
                            out += String.fromCharCode(ch);
                            break;
                    }
                    if(this.options.locations) {
                        ++this.curLine;
                        this.lineStart = this.pos;
                    }
                    chunkStart = this.pos;
                } else {
                    ++this.pos;
                }
            }
        }

        readInvalidTemplateToken = function() {
            for(; this.pos < this.input.length; this.pos++) {
                const code = this.input[this.pos];
                switch (code) {
                    case '\\':
                        ++this.pos;
                        break;
                    case '#':
                    case '$':
                        if(this.input[this.pos + 1] !== '{') {
                            break;
                        }
                        // fallthrough if #{ or ${
                    case '{':
                        if(code !== '$' && this.curContext() !== az_tmpl) {
                            break;
                        }
                        // fallthrough if ${ or azoth template with #{ or {
                    case '`': // Template done so invalid quasi token done.
                        // This line unchanged from acorn
                        return this.finishToken(tt.invalidTemplate, this.input.slice(this.start, this.pos));
          
                    // no default
                }
            }
            this.raise(this.start, 'Unterminated template');
        };

        /* Parsing Methods */
        parseExprAtomDefault() {
            if(this.type !== sigilQuote) {
                return super.parseExprAtomDefault();
            }

            return this.parseAzothTemplate();
        }

        // copied from acorn "parseTemplate" in acorn
        parseAzothTemplate() {
            const azothNode = this.startNode();
            const node = this.startNode();
            this.next();

            // asymmetrical first template element
            let curElt = this.parseTemplateElement({ isTagged : false });
            node.quasis = [curElt];
            node.bindings = [];
            node.expressions = [];

            while(!curElt.tail) {
                if(this.type === tt.eof) this.raise(this.pos, 'Unterminated template literal');
                // expect ${, #{, or {
                if(!lBraces.has(this.type)) this.unexpected();
                node.bindings.push(this.type.label);
                this.next();
                // ...expression ...
                node.expressions.push(this.parseExpression());
                // }
                this.expect(tt.braceR);
                
                // template element
                node.quasis.push(curElt = this.parseTemplateElement({ isTagged : true }));
            }

            this.next();
            this.finishNode(node, 'TemplateLiteral');
            azothNode.template = node;
            return this.finishNode(azothNode, 'AzothTemplate');

        }
          
    };
}