
export function compose(input: any, anchor: Comment, keepLast: boolean = false) {
    const type = typeof input;
    switch(true) {
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            if(!keepLast) removePrior(anchor);
            break;
        case type === 'string':
        case type === 'number':
        case input instanceof Node: {
            inject(input, anchor, keepLast);
            break;
        }
        case input instanceof Promise:
            input.then(v => compose(v, anchor, keepLast));
            break;
        case Array.isArray(input):
            composeArray(input, anchor, keepLast);
            break;

        default:
            throw new Error(`Invalid block type ${type}, ${input}`);
    }
}

function removePrior(anchor: Comment) {
    const count = +anchor.data;
    if(count > 0 && tryRemovePrior(anchor)) anchor.data = `${count - 1}`;
}


function inject(input: any, anchor: Comment, keepLast: boolean) {
    let count = +anchor.data;
    if(!keepLast && count > 0 && tryRemovePrior(anchor)) count--;
    anchor.before(input);
    anchor.data = `${count + 1}`
}

// TODO: array in array with replace param
function composeArray(array: any[], anchor: Comment, replace: boolean) {
    for(let i = 0; i < array.length; i++) {
        compose(array[i], anchor, false);
    }
}

function tryRemovePrior({ previousSibling }: Comment) {
    return previousSibling ? (previousSibling.remove(), true) : false;
}
