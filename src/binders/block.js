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
                for(let i = 0; i < unsubscribes.length; i++) {
                    const unsub = unsubscribes[i];
                    if(unsub.unsubscribe) unsub.unsubscribe();
                }
            } else {
                unsubscribes.unsubscribe && unsubscribes.unsubscribe();
            }
            unsubscribes = null;
        };
        
        const observer = val => {
            removePrior(top, anchor);
            unsubscribe();
            if(!val) return;
            
            const fragment = toFragment(val);

            if(Array.isArray(fragment)) {
                unsubscribes = [];
                let toAppend = null;
                for(let i = 0; i < fragment.length; i++) {
                    const f = toFragment(fragment[i]);
                    if(!f) continue;

                    if(f.unsubscribe) unsubscribes.push(f.unsubscribe);
                    
                    if(toAppend === null) toAppend = f;
                    else toAppend.appendChild(f);
                }
                if(toAppend) insertBefore(toAppend, anchor);
            } else {
                if(!fragment) return;
                unsubscribes = fragment.unsubscribe || null;
                insertBefore(fragment, anchor);
            }
        };

        return { observer, unsubscribe };
    };
}

const toFragment = val => typeof val === 'function' ? val() : val;

const removePrior = (top, anchor) => {
    let sibling = top.nextSibling;
    while(sibling && sibling !== anchor) {
        const current = sibling;
        sibling = sibling.nextSibling;
        current.remove();
    }
};