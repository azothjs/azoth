export default function renderer(fragment) {

    init(fragment);

    return function render() {
        const clone = fragment.cloneNode(true);
        const nodes = clone.querySelectorAll('[data-bind]');
        const arr = new Array(nodes.length + 1);
        for(let i = 0; i < nodes.length; i++) arr[i] = nodes[i];
        arr[nodes.length] = clone;
        return arr;
    };
}

function init(fragment) {
    const nodes = fragment.querySelectorAll('text-node');
    for(var i = 0, node = nodes[i]; i < nodes.length; node = nodes[++i]) {
        node = nodes[i];
        node.parentNode.replaceChild(document.createTextNode(''), node);
    }
}