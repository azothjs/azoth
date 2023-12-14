import { isIdentifierStart } from 'acorn';

// The map to `acorn-jsx` tokens from `acorn` namespace objects.
const acornJszMap = new WeakMap();

// Get the original tokens for the given `acorn` namespace object.
function getJszTokens(acorn) {
    acorn = acorn.Parser.acorn || acorn;
    let acornJsz = acornJszMap.get(acorn);
    if(acornJsz) return acornJsz;
    
    const tt = acorn.tokTypes;
    const tc = acorn.tokContexts;
    const TokContext = acorn.TokContext;
    const TokenType = acorn.TokenType;

    const tc_decorator = new TokContext('@', true);
    const tokContexts = {
        tc_decorator,
    };

    const tokTypes = {
        jszDecorator: new TokenType('@'),
        jszHashBraceL: new TokenType('#{', { beforeExpr: true, startsExpr: true }),
    };
  
    tokTypes.jszDecorator.updateContext = function() {
        this.context.push(tc_decorator); 
    };

    tokTypes.jszHashBraceL.updateContext = tt.dollarBraceL.updateContext;

    tt.backQuote.updateContext = function() {
        if(this.curContext() === tc.q_tmpl) { 
            this.context.pop(); 
            if(this.curContext() === tokTypes.jszDecorator) { 
                this.context.pop(); 
            }   
        }
        else { 
            this.context.push(tc.q_tmpl); 
        }
        this.exprAllowed = false;
    };
  
    acornJsz = { tokContexts: tokContexts, tokTypes: tokTypes };
    acornJszMap.set(acorn, acornJsz);
    

    return acornJsz;

}


function plugin(options, Parser) {
    const acorn = Parser.acorn;
    const acornJsz = getJszTokens(acorn);

    const tt = acorn.tokTypes;
    const tok = acornJsz.tokTypes;
    const tokContexts = acorn.tokContexts;

    const isNewLine = acorn.isNewLine;
    // const isIdentifierStart = acorn.isIdentifierStart;
    // const isIdentifierChar = acorn.isIdentifierChar;
    
    
    let isAzothTemplate = false;
  
    return class extends Parser {
        // Expose actual `tokTypes` and `tokContexts` to other plugins.
        static get acornJsz() {
            return acornJsz;
        }

        static tokenizer(input, options) {
            return new this(options, input);
        }

        readToken(code) {
            // console.log(code, String.fromCharCode(code));
            // console.log('expression allowed', this.exprAllowed);

            if(code === 64) { // @
                this.readToken_decorator();
            }
            else {
                super.readToken(code);

            }
        }

        readToken_decorator() {
            ++this.pos;
            const code = this.fullCharCodeAtPos();
            if(code === 96) { // `
                isAzothTemplate = true;
                return this.finishToken(tok.jszDecorator);
            }
              
            this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "', expected '`'");
        }


        // these are copied methods from base acorn parser
        readTmplToken() {
            let out = '', chunkStart = this.pos;
            for(;;) {
                if(this.pos >= this.input.length) this.raise(this.start, 'Unterminated template');
                let ch = this.input.charCodeAt(this.pos);
                // Added other interpolator types:
                if(ch === 96 || ch === 123 || (ch === 36 || ch === 35) && this.input.charCodeAt(this.pos + 1) === 123) { // '`', '{', '${', '#{'
                    if(this.pos === this.start && (this.type === tt.template || this.type === tt.invalidTemplate)) {
                        if(ch === 123) {
                            ++this.pos;
                            return this.finishToken(tt.braceL);
                        }
                        if(ch === 35) {
                            this.pos += 2;
                            return this.finishToken(tok.jszHashBraceL);
                        }
                        else if(ch === 36) {
                            this.pos += 2;
                            return this.finishToken(tt.dollarBraceL);
                        } else {
                            ++this.pos;
                            return this.finishToken(tt.backQuote);
                        }
                    }
                    out += this.input.slice(chunkStart, this.pos);
                    return this.finishToken(tt.template, out);
                }
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
                        // in the acorn source code, so we assume on purpose
                        /* eslint-disable no-fallthrough */
                        case 10:
                            out += '\n';
                            break;
                        /* eslint-enable no-fallthrough */
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
    };
}

export default function acornJszFactoryConfig(options) {
    options = options ?? {};

    return function acornJszFactory(Parser) {
        return plugin(options, Parser);
    };
}

// TODO: open issue on acornjs for exporting utils
function codePointToString(code) {
    // UTF-16 Decoding
    if(code <= 0xFFFF) return String.fromCharCode(code);
    code -= 0x10000;
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00);
}