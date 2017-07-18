
export default function __blockBinder(index) {
    return node => {
        const anchor = node.childNodes[index];
        const insertBefore = node => anchor.parentNode.insertBefore(node, anchor);

        const top = document.createComment(' block start ');
        insertBefore(top, anchor);
        
        let unsubscribes = null;
        const unsubscribe = () => {
            if(!unsubscribes) return;
            
            if(Array.isArray(unsubscribes)) {
                for(let unsub of unsubscribes) unsub.unsubscribe && unsub.unsubscribe();
            } else {
                unsubscribes.unsubscribe && unsubscribes.unsubscribe();
            }
        };
        
        const observer = val => {
            removePrior(top, anchor);
            unsubscribe();
            const fragment = toFragment(val);

            if(Array.isArray(fragment)) {
                unsubscribes = [];
                for(let f of fragment) {
                    if(f.unsubscribe) unsubscribes.push(f.unsubscribe);
                    insertBefore(f, anchor);
                }
            } else {
                unsubscribes = fragment.unsubscribe || null;
                insertBefore(fragment, anchor);
            }
        };

        return { observer, unsubscribe };
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