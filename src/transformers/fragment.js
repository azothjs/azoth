import { 
    arrowFunctionExpression,
    callExpression,
    declareVar, 
    identifier,
    literal, 
    memberExpression,
    returnStatement } from './common';
import { 
    FRAGMENT, 
    SUB, 
    RENDER } from './identifiers';
// import { VALUE } from '../binders/binding-types';

// const __renderer${suffix} = __${importName}(${arg});
export const declareRender = (suffix, importName, arg) => declareVar({ 
    name: `${RENDER}${suffix}`, 
    init: callExpression({ 
        name: importName,
        args: [literal(arg)]
    })
});  

// return __fragment;
const RETURN_FRAGMENT = returnStatement({ arg: identifier(FRAGMENT) });

/*
// __sub${index}${suffix}.unsubscribe();
const unsubscribe = (index, suffix = '') => {
    const callee = memberExpression({
        name: `${SUB}${index}${suffix}`, 
        property: identifier('unsubscribe')
    });

    return {
        type: 'ExpressionStatement',
        expression: callExpression({ callee })
    };
};

const unsubscribes = (binders, prefix = '') => {
    const unsubs = [];
    binders.forEach((binder, i) => {
        const { type, target } = binder;
        const id = prefix + i;
        if(type && type !== VALUE) unsubs.push(unsubscribe(id));
        if(target.isBlock || target.isComponent) unsubs.push(unsubscribe(id, 'b')); 
        unsubs.push(...unsubscribes(binder.properties, `${id}_`));
    });
    return unsubs;
};


// __fragment.unsubscribe = () => {
//     ${unsubscribes}
// };
const fragmentUnsubscribe = unsubscribes => {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: memberExpression({
                name: FRAGMENT,
                property: identifier('unsubscribe')
            }),
            right: arrowFunctionExpression({ block: unsubscribes })
        }
    };
};

export const unsubscribeBinders = binders => {
    const unsubs = unsubscribes(binders);
    if(!unsubs.length) return [RETURN_FRAGMENT];
    return [
        fragmentUnsubscribe(unsubs),
        RETURN_FRAGMENT
    ];
};
*/