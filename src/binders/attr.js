const isProp = (name, node) => name in node;

export default function attrBinder(node, name) {
    return isProp(name, node)
        ? val => node[name] = val
        : val => node.setAttribute(name, val);
}
