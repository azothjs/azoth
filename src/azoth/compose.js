
export function compose(input, anchor) {
    const type = typeof input;
    switch(true) {
        case type === 'string':
        case type === 'number':
            anchor.before(input);
            break;
        case input instanceof Node:
            anchor.replaceWith(input);
            break;
        case Array.isArray(input):
            composeArray(input, anchor);
            break;
        default:
            throw new Error('Invalid block type', type, input);
    }
}

function composeArray(array, anchor) {
    for(let i = 0; i < array.length; i++) {
        const input = array[i];
        if(input instanceof Node) {
            anchor.before(input);
        }
        compose(input, anchor);
    }
}