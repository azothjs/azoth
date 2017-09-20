export default function propBinder(target, name) {
    return val => target[name] = val;
}
