export default function renderer(fragment : DocumentFragment) {

    // const nodes = fragment.querySelectorAll('text-node');
    // let node = null;
    // for(var i = 0; i < nodes.length; node = nodes[++i]) {
    //     node = nodes[i];
    //     node.parentNode.replaceChild(document.createTextNode(''), node);
    // }

    return function render() {
        const clone = <DocumentFragment>fragment.cloneNode(true);
        return {
            fragment: clone,
            targets: clone.querySelectorAll('[data-bind]')
        };
    };
}