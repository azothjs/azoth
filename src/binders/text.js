export default function textBinder(index) {
    return node => {
        const text = node.childNodes[index];
        return val => text.nodeValue = val;
    };
}