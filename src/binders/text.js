export default function textBinder(node) {
    return val => node.nodeValue = val;
}