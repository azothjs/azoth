export default function renderer(fragment) {

    const nodes = fragment.querySelectorAll('text-node');
    let node = null;
    for(var i = 0; i < nodes.length; node = nodes[++i]) {
        node = nodes[i];
        node.parentNode.replaceChild(document.createTextNode(''), node);
    }

    return function render() {
        const clone = fragment.cloneNode(true);
        return { 
            __fragment: clone, 
            __nodes: clone.querySelectorAll('[data-bind]') 
        };
    };
}