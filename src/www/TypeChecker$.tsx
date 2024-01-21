
class $ extends HTMLElement {}

class TypeChecker$ extends $ {
    static __expr_to_$ = (Constructor) => {
        if(Constructor.prototype instanceof $) return Constructor;
        throw new TypeError(`\
Unexpected base class "${Constructor.name}", \
expected ${$.prototype.constructor.name}.`
        );
    
    
    };
}
class OtherIdentifier {

}
class NotCatCard extends OtherIdentifier {}

function testTypeChecker$() {
    try {
        TypeChecker$.__expr_to_$(NotCatCard);
    }
    catch(e) {
        if(e instanceof TypeError) return true;
    }

    return false;
}

console.log('wrapping static method throws runtime error if extends class is not instanceof $:');
const test = () => testTypeChecker$();
console.log(`"${test} === ${true}"`, test() === true);
