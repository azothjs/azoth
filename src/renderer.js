export default function renderer(fragment) {

    init(fragment);

    return function render() {
        const clone = fragment.cloneNode(true);
        const nodes = clone.querySelectorAll('[data-bind]');
        nodes[ nodes.length ] = clone;
        return nodes;
    };
}

function init(fragment) {
    const nodes = fragment.querySelectorAll('text-node');
    for(var i = 0, node = nodes[i]; i < nodes.length; node = nodes[++i]) {
        node = nodes[i];
        node.parentNode.replaceChild(document.createTextNode(''), node);
    }
}