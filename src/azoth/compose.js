
export function compose(anchor, input) {
    if(typeof input === 'string') {
        anchor.data = input;
    }
    else if(input instanceof Node) {
        anchor.replaceWith(input);
    }
}