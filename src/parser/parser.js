/* eslint-disable no-fallthrough */
// - Acorn source uses intentional fallthrough in switch/case.
// - Code structure within the constraints of being an acorn 
//   parser plugin and favoring it's existing style and paradigm.
// - Initial inspiration and example on getting started:
//   https://github.com/acornjs/acorn-jsx/blob/main/index.js

import { TemplateParser } from './template/html-parser.js';

export function extend(Parser, azTokens) {
    const SIGIL_CODE = '#'.charCodeAt(0);
    
    const acorn = Parser.acorn;
    const { isNewLine, getLineInfo } = acorn;

    const tt = acorn.tokTypes;
    const { hashQuote, hashBraceL } = azTokens.tokTypes;
    const { dom_tmpl } = azTokens.tokContexts;

    const lBraces = new Set([hashBraceL, tt.dollarBraceL, tt.braceL]);
    
    const TMPL_PUNCTUATION = {
        '96': tt.backQuote,
        '36': tt.dollarBraceL,
        '123': tt.braceL,
        '35': hashBraceL,
    };
    
    return class extends Parser {
        // Expose azoth `tokTypes` and `tokContexts` to other plugins.
        // Cause that's what the jsx plugin did, ;)
        static get azothTokens() {
            return azTokens;
        }

        /* Tokenization Method */
        static tokenizer(input, options, start) {
            return new this(options, input, start);
        }

        readToken(code) {
            // Azoth template : SIGIL`
            if(code === SIGIL_CODE) {
                const { input, pos } = this;

                this.pos++;

                if(input.charCodeAt(this.pos) === 47        // "/"
                    && input.charCodeAt(pos + 2) === 42) { // *
                    this.skipBlockComment(); // will advance this.pos
                }

                const charCode = input.charCodeAt(this.pos);

                if(charCode === 96) { // "`"
                    this.pos++;
                    return this.finishToken(hashQuote);
                }
                else {
                    this.raise(this.pos, `Expected "\`" after "#" but found character "${String.fromCharCode(charCode)}"`);
                }
            }
            super.readToken(code);
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
                    const isAzTmpl = this.curContext() === dom_tmpl;
                    const hasBraceLNext = (isHash || isDollar) && this.input.charCodeAt(this.pos + 1) === 123; // {
                    const isDollarBraceL = isDollar && hasBraceLNext; // ${
                    const isHashBraceL = isHash && hasBraceLNext; // #{

                    // Azoth interpolator found in normal template. 
                    if(!isAzTmpl && (isHashBraceL || (isBraceL && this.input.charCodeAt(this.pos - 1) === 35))) {
                        // If the DX works and no syntax highlight we can prob skip.
                        // Still would need the "if" because it prevents the else code and
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
                            const token = TMPL_PUNCTUATION[ch];
                            this.pos += token.label.length;
                            return this.finishToken(token);
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
                // isNewLine is imported from acorn for this call
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
                        if(code !== '$' && this.curContext() !== dom_tmpl) {
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
            if(this.type !== hashQuote) {
                return super.parseExprAtomDefault();
            }

            return this.parseAzothTemplate();
        }

        // based on "parseTemplate" in acorn
        parseAzothTemplate() {
            const node = this.startNode();
            this.next();

            const parser = new TemplateParser();

            // start with template elements read as always +1 in length vs expressions
            let curElt = this.parseTemplateElement({ isTagged : false }); // isTagged controls invalid escape sequences            
            node.quasis = [curElt];
            node.expressions = [];
            node.interpolators = [];
            if(curElt.tail) {
                parser.end(curElt.value.raw);
            }

            while(!curElt.tail) {
                if(this.type === tt.eof) this.raise(this.pos, 'Unterminated template literal');
                // expect ${, #{, or {
                if(!lBraces.has(this.type)) this.unexpected();

                const interpolator = this.startNode();
                interpolator.name = this.type.label;
                node.interpolators.push(this.finishNode(interpolator, 'TemplateInterpolator'));

                // TODO: Reactive expressions
                // const azothExpr = this.startNode();
                // node.expressions.push(azothExpr);

                // ...expression...
                this.next();
                const expr = this.parseExpression();
                node.expressions.push(expr);
                
                // closing }
                this.expect(tt.braceR);

                // this.finishNode(azothExpr, 'AzothExpression');
                
                parser.write(curElt.value.raw);

                // next template element
                node.quasis.push(curElt = this.parseTemplateElement({ isTagged : true }));

                if(curElt.tail) parser.end(curElt.value.raw);
            }
            node.html = parser.html;
            node.bindings = parser.bindings;

            this.next();
            return this.finishNode(node, 'DomTemplateLiteral');
        }
    };
}