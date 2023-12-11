import { 
    arrayExpression,
    arrowFunctionExpression,
    callExpression, 
    declareConst, 
    identifier,
    literal, 
    memberExpression } from './common';
import { 
    COMBINE, 
    COMBINE_FIRST, 
    FIRST, 
    MAP, 
    MAP_FIRST, 
    SUBSCRIBE, 
    VALUE } from '../binders/binding-types';
import { 
    BINDER, 
    CHILD, 
    NODES, 
    SUB, 
    FIRST_IMPORT, 
    FRAGMENT,
    MAP_IMPORT, 
    COMBINE_IMPORT } from './identifiers';

export function initBinder({ name, arg, index }) {
    return declareConst({
        name: `${BINDER}${index}`,
        init: callExpression({
            name,
            args: [
                literal({ value: arg })
            ]
        })
    });
}

const fragment = identifier(FRAGMENT);

function nodeByIndex(elIndex) {
    if(elIndex === -1) return fragment;
    return memberExpression({
        name: NODES, 
        property: literal({ value: elIndex }), 
        computed: true
    });
}

export function childNode(binder, index ) {
    if(!binder.isChildIndex) return;

    // const __child${index} = __nodes[${binder.elIndex}].childNodes[${binder.index}];
    return declareConst({
        name: `${CHILD}${index}`,
        init: memberExpression({
            object: memberExpression({
                object: nodeByIndex(binder.elIndex), 
                property: literal({ raw: 'childNodes' }),
            }),            
            property: literal({ value: binder.childIndex }),
            computed: true
        })
    });
}

const bindings = {
    [COMBINE]: combineBinding,
    [COMBINE_FIRST]: combineFirstBinding,
    [FIRST]: firstBinding,
    [MAP]: mapBinding,
    [MAP_FIRST]: mapFirstBinding,
    [SUBSCRIBE]: subscribeBinding,
    [VALUE]: valueBinding,
};

export function binding(binder, i) {
    if(binder.name === 'oninit') return;
    return makeBinding(binder, i);
}

export function nodeInits(binder, i) {
    if(binder.name !== 'oninit') return;
    return makeBinding(binder, i);
}

function makeBinding(binder, i, observer = nodeBinding(binder, i)) {

    const { type, target, properties } = binder;
    const typeBinding = bindings[type];
    const statements = [];
    
    if(target.isBlock || target.isComponent) {
        const id = identifier(`${SUB}${i}b`);
        const init = target.isComponent ? binder.ast : observer;
        const declare = declareConst({ id, init });
        statements.push(declare);

        if(target.isComponent) {
            properties.forEach((p, j) => {
                const selfObserver = componentBinding(p, id);
                statements.push(...makeBinding(p, `${i}_${j}`, selfObserver));
            });
            
            const onanchor = {
                type: 'ExpressionStatement',
                expression: callExpression({
                    callee: memberExpression({
                        object: id,
                        property: identifier('onanchor')
                    }),
                    args: [literal({ raw: `${CHILD}${i}` })]
                })
            }; 
            statements.push(onanchor);
        }
        else {
            observer = memberExpression({
                object: id,
                property: identifier('observer')
            });
            statements.push(typeBinding(observer, binder, i));
        }
    }
    else {
        statements.push(typeBinding(observer, binder, i));
    }

    return statements;
}

function nodeBinding(binder, index) {
    if(binder.isChildIndex) {
        // ${binder.binderName}(__child${index})
        return callExpression({
            name: binder.binderName, 
            args: [
                literal({ raw: `${CHILD}${index}` })
            ]
        });
    }
    // ast => ast(__nodes[0]) 
    else if(binder.name === 'oninit') {
        const oninit = identifier('oninit');
        return arrowFunctionExpression({ 
            body: callExpression({
                callee: oninit,
                args: [nodeByIndex(binder.elIndex)]
            }),
            params: [oninit]
        });
    } 
    else {
        // ${binder.binderName}(__nodes[${elIndex}], ${binder.name})
        return callExpression({
            name: binder.binderName, 
            args: [
                nodeByIndex(binder.elIndex),
                literal({ value: binder.name })
            ]
        });
    }
}

// ${binderName}(${name}, <identifier>)
function componentBinding({ binderName, name }, componentIdentifier) {
    return callExpression({
        name: binderName, 
        args: [
            componentIdentifier,
            literal({ value: name })            
        ]
    });
}

// <nodeBinding>(<ast>);
function valueBinding(nodeBinding, binder) {
    const { ast } = binder;

    return {
        type: 'ExpressionStatement',
        expression: callExpression({
            callee: nodeBinding,
            args: [ast]
        })
    };
}

// const __sub${index} = <init>
function subscription(index, init) {
    return declareConst({
        name: `${SUB}${index}`, 
        init
    });
}

// const __sub${binderIndex} = (<ast>).subscribe(<nodeBinding>);
function subscribeBinding(nodeBinding, binder, index) {
    const { ast } = binder;

    return subscription(
        index, 
        callExpression({
            callee: memberExpression({ 
                object: ast, 
                property: identifier('subscribe')
            }),
            args: [nodeBinding]
        }) 
    );
}

// const __sub${binderIndex} = __first(observable, <nodeBinding>);
function firstBinding(nodeBinding, binder, binderIndex) {
    const { observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        nodeBinding
    ];

    return subscription(
        binderIndex, 
        callExpression({
            name: FIRST_IMPORT,
            args
        }) 
    );
}

function addOnce(args) {
    args.push(literal({ value: true }));
}

function mapFirstBinding(nodeBinding, binder, binderIndex) {
    return mapBinding(nodeBinding, binder, binderIndex, true);
}

// const __sub${binderIndex} = __map(observable, observable => (<ast>), <nodeBinding> [, true]);
function mapBinding(nodeBinding, binder, binderIndex, firstValue = false) {
    const { ast, observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        arrowFunctionExpression({ 
            body: ast,
            params: [observable]
        }),
        nodeBinding
    ];
    if(firstValue) addOnce(args);

    return subscription(
        binderIndex, 
        callExpression({
            name: MAP_IMPORT,
            args
        }) 
    );
}

function combineFirstBinding(nodeBinding, binder, binderIndex) {
    return combineBinding(nodeBinding, binder, binderIndex, true);
}

// const __sub${binderIndex} = __combine([o1, o2, o3], (o1, o2, o3) => (<ast>), <nodeBinding> [, true]);
function combineBinding(nodeBinding, binder, binderIndex, firstValue = false) {
    const { ast, observables } = binder;
    const params = observables.map(identifier);
    const args =  [
        arrayExpression({ elements: params }), 
        arrowFunctionExpression({ 
            body: ast,
            params
        }),
        nodeBinding
    ];
    if(firstValue) addOnce(args);

    return subscription(
        binderIndex, 
        callExpression({
            name: COMBINE_IMPORT,
            args
        }) 
    );
}
