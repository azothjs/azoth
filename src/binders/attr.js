const isProp = (name, node) => name in node;

export default function attrBinder(name) {
    return node => {
        return isProp(name, node)
            ? val => node[name] = val
            : val => node.setAttribute(name, val);
    };
}
