

// The map to `acorn-az` tokens from `acorn` namespace objects.
const acornAzMap = new WeakMap();

// Get the original tokens for the given `acorn` namespace object.
export function getAzTokens(acorn) {
    acorn = acorn.Parser.acorn ?? acorn;
    let acornAz = acornAzMap.get(acorn);
    if(acornAz) return acornAz;
    acornAz = createAzTokens(acorn);
    acornAzMap.set(acorn, acornAz);
    return acornAz;
}

function createAzTokens(acorn) {
    const { TokenType, TokContext } = acorn;
    const { tokTypes: types, tokContexts: contexts } = acorn;

    /* new azoth token context based on query template */
    const { isExpr, preserveSpace, override, generator } = contexts.q_tmpl;
    const az_tmpl = new TokContext('@`', isExpr, preserveSpace, override, generator);

    /* new azoth token types */
    // azoth @` tagged template
    const sigilQuote = new TokenType('@`');
    sigilQuote.updateContext = function() {
        this.context.push(az_tmpl);
    };
    // extend backQuote.updateContext to close @` as well
    const bQUpdateSuper = types.backQuote.updateContext;
    types.backQuote.updateContext = function(prevType) {
        if(this.curContext() !== az_tmpl) {
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
            sigilQuote,
            hashBraceL
        }
    };
}
