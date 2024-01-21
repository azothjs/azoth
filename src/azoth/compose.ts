
export function compose(input: any, anchor: Comment) {
    const type = typeof input;
    switch(true) {
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            const count = +anchor.data;
            if(count > 0 && trimPrior(anchor)) anchor.data = `${count - 1}`;
            break;
        case type === 'string':
        case type === 'number':
        case input instanceof Node: {
            let count = +anchor.data;
            if(count > 0 && trimPrior(anchor)) count--; 
            anchor.before(input);
            anchor.data = `${count + 1}`
            return true;
        }
        case Array.isArray(input):
            return composeArray(input, anchor);
        default:
            throw new Error(`Invalid block type ${type}, ${input}`);
    }
}

const trimPrior = ({ previousSibling }: Comment) => {
    return previousSibling ? (previousSibling.remove(), true) : false;
}

function composeArray(array: any[], anchor: Comment) {
    let any = false;
    for(let i = 0; i < array.length; i++) {
        const input = array[i];
        if(input instanceof Node) {
            anchor.before(input);
            any = true;
        }
        any = compose(input, anchor) || any;
    }
    return any;
}