export function create(acorn) {
    const { TokenType, TokContext } = acorn; // classes
    const { tokTypes, tokContexts } = acorn; // instances

    /* new context types */
    
    // dom template context based on query (string) template
    const { isExpr, preserveSpace, override, generator } = tokContexts.q_tmpl;
    const dom_tmpl = new TokContext('#`', isExpr, preserveSpace, override, generator);

    /* new token types */
    
    // #` token type
    const hashQuote = new TokenType('#`');
    hashQuote.updateContext = function() {
        this.context.push(dom_tmpl);
    };

    // Extend backQuote.updateContext to close dom_tmpl context
    const bQUpdateSuper = tokTypes.backQuote.updateContext;
    tokTypes.backQuote.updateContext = function(prevType) {
        if(this.curContext() !== dom_tmpl) {
            return bQUpdateSuper.call(this, prevType);
        }
        this.context.pop();
        this.exprAllowed = false;
    };

    // #{ dom interpolator
    const hashBraceL = new TokenType('#{', { beforeExpr: true, startsExpr: true });
    // } updates context for #{, ${, and {
    hashBraceL.updateContext = tokTypes.dollarBraceL.updateContext;

    return {
        tokContexts: {
            dom_tmpl
        },
        tokTypes: {
            hashQuote,
            hashBraceL
        }
    };
}
