
export default function __blockBinder( index ) {
    return node => {
        const anchor = node.childNodes[ index ];
        const insertBefore = node => anchor.parentNode.insertBefore(node, anchor);

        // TODO: pass in block observe status so we know not to do this work if possible 
        // insert a top and iterate till anchor to remove
        const top = document.createComment('block start');
        insertBefore(top, anchor);
        
        let unsubscribe = null;
        const callUnsubscribe = () => {
            if(!unsubscribe) return;
            
            if(Array.isArray(unsubscribe)) {
                for(let unsub of unsubscribe) unsub.unsubscribe && unsub.unsubscribe();
            } else {
                unsubscribe.unsubscribe && unsubscribe.unsubscribe();
            }
        };
        
        return val => {
            removePrior(top, anchor);
            callUnsubscribe();
            const fragment = toFragment(val);
            if(Array.isArray(fragment)) {
                unsubscribe = [];
                for(let f of fragment) {
                    if(f.unsubscribe) unsubscribe.push(f.unsubscribe);
                    insertBefore(f, anchor);
                }
            } else {
                unsubscribe = fragment.unsubscribe || null;
                insertBefore(fragment, anchor);
            }
        };
    };
}

const toFragment = val => typeof val === 'function' ? val() : val;

// TODO: need to unsubscribe to prior fragment
const removePrior = (top, anchor) => {
    let sibling = top.nextSibling;
    while(sibling && sibling !== anchor) {
        const current = sibling;
        sibling = sibling.nextSibling;
        current.remove();
    }
};