export default function __blockBinder( index ) {
    return node => {
        const anchor = node.childNodes[ index ];
        const insertBefore = node => anchor.parentNode.insertBefore(node, anchor);

        // TODO: pass in block observe status so we know not to do this work if possible 
        // insert a top and iterate till anchor to remove
        const top = document.createComment('block start');
        insertBefore(top, anchor);
        
        return val => {
            removePrior(top, anchor);
            const fragment = typeof val === 'function' ? val() : val;
            Array.isArray(fragment) ? fragment.forEach(f => insertBefore(f, anchor)) : insertBefore(fragment, anchor);
        };
    };
}

const removePrior = (top, anchor) => {
    let sibling = top.nextSibling;
    while(sibling && sibling !== anchor) {
        const current = sibling;
        sibling = sibling.nextSibling;
        current.remove();
    }
};