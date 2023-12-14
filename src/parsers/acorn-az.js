import { getLineInfo } from 'acorn';

export default function acornAzFactoryConfig(options) {
    options = options ?? {};
    return function acornAzFactory(Parser) {
        return plugin(options, Parser);
    };
}

function plugin(options, Parser) {
    const acorn = Parser.acorn;
    const acornAz = getAzTokens(acorn);

    const tt = acorn.tokTypes;
    const { atBackQuote, hashBraceL } = acornAz.tokTypes;
    const { az_tmpl } = acornAz.tokContexts;

    const isNewLine = acorn.isNewLine;


    const TMPL_END = {
        '96': tt.backQuote,
        '36': tt.dollarBraceL,
        '123': tt.braceL,
        '35': hashBraceL,
    };
     
    return class extends Parser {
        // Expose actual `tokTypes` and `tokContexts` to other plugins.
        static get acornAz() {
            return acornAz;
        }

        static tokenizer(input, options) {
            return new this(options, input);
        }

        readToken(code) {
            // Azoth template : "@`"
            if(code === 64 && this.input.charCodeAt(this.pos + 1) === 96) {
                this.pos += 2;
                return this.finishToken(atBackQuote);
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

        // these are copied methods from base acorn parser
        readTmplToken() {
            let out = '', chunkStart = this.pos;
            for(;;) {
                if(this.pos >= this.input.length) this.raise(this.start, 'Unterminated template');
                let ch = this.input.charCodeAt(this.pos);

                // Look for end of template quasi
                const isBackQuote = ch === 96; // `
                const isDollar = ch === 36; // $
                const isHash = ch === 35; // #
                const isBraceL = ch === 123; // {

                if(isBackQuote || isDollar || isHash || isBraceL) {
                    const isAzTmpl = this.curContext() === az_tmpl;
                    const nextIsBraceL = this.input.charCodeAt(this.pos + 1) === 123; // {
                    const isDollarBraceL = ch === 36 && nextIsBraceL; // ${
                    const isHashBraceL = ch === 35 && nextIsBraceL; // #{

                    if(!isAzTmpl && (isHashBraceL || (isBraceL && this.input.charCodeAt(this.pos - 1) === 35))) {
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
                    else {
                        if(isBackQuote || isDollarBraceL || (isAzTmpl && (isBraceL || isHashBraceL))) { // ` { ${ #{
                            if(!(this.pos === this.start && (this.type === tt.template || this.type === tt.invalidTemplate))) {
                            // finish template token:
                                out += this.input.slice(chunkStart, this.pos);
                                return this.finishToken(tt.template, out);
                            }
                            // finish boundary token (backQuote or interpolator)
                            return this.readTmplEnd(ch);
                        }

                    }
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


// The map to `acorn-jsx` tokens from `acorn` namespace objects.
const acornAzMap = new WeakMap();

// Get the original tokens for the given `acorn` namespace object.
function getAzTokens(acorn) {
    acorn = acorn.Parser.acorn ?? acorn;
    let acornAz = acornAzMap.get(acorn);
    if(acornAz) return acornAz;
    acornAz = createAzTokens(acorn);
    acornAzMap.set(acorn, acornAz);
    return acornAz;
}

function createAzTokens(acorn) { 
    const { TokenType, TokContext } = acorn;
    const { tokTypes : types, tokContexts: contexts } = acorn;

    /* new azoth token context based on query template */
    const { isExpr, preserveSpace, override, generator } = contexts.q_tmpl;
    const az_tmpl = new TokContext('@`', isExpr, preserveSpace, override, generator);

    /* new azoth token types */

    // azoth @` tagged template
    const atBackQuote = new TokenType('@`');
    atBackQuote.updateContext = function() {
        this.context.push(az_tmpl); 
    };    
    // extend backQuote.updateContext to close @` as well
    const bQUpdateSuper = types.backQuote.updateContext;
    types.backQuote.updateContext = function(prevType) {
        if(this.curContext() !== az_tmpl){
            return bQUpdateSuper.call(this, prevType);
        }

        this.context.pop();
        this.exprAllowed = false;

    };

    // azoth #{ dom interpolator
    const hashBraceL = new TokenType('#{', { beforeExpr: true, startsExpr: true });
    hashBraceL.updateContext = types.dollarBraceL.updateContext;

    return { 
        tokContexts: { 
            az_tmpl
        }, 
        tokTypes: { 
            atBackQuote, 
            hashBraceL 
        } 
    };
}

// TODO: open issue on acorn for exporting utils
function codePointToString(code) {
    // UTF-16 Decoding
    if(code <= 0xFFFF) return String.fromCharCode(code);
    code -= 0x10000;
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00);
}
