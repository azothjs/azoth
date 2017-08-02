export default function componentBinder(index) {
    return node => {
        return node.childNodes[index];
    };
}