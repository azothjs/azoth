
export function compose(input, anchor) {
    if(typeof input === 'string') {
        anchor.data = input;
    }
    else if(input instanceof Node) {
        anchor.replaceWith(input);
    }
    if(typeof input === 'number') {
        anchor.data = input;
    }
    else if(Array.isArray(input)) {
        composeArray(input, anchor);
    }
}

function composeArray(array, anchor) {
    for(let i = 0; i < array.length; i++) {
        composeBefore(array[i], anchor);
    }
}

function composeBefore(input, anchor) {
    if(typeof input === 'string') {
        anchor.before(input);
    }
    else if(input instanceof Node) {
        anchor.before(input);
    }
    if(typeof input === 'number') {
        anchor.before(input);
    }
    else if(Array.isArray(input)) {
        composeArray(input, anchor);
    }
}