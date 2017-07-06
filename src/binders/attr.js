const isProp = (name, node) => name in node;

export default function textBinder(name) {
    return node => {
        return isProp(name, node)
            ? val => node[name] = val
            : val => node.setAttribute(name, val);
    };
}
