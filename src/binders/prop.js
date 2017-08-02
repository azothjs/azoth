export default function propBinder(name) {
    return target => val => target[name] = val;
}
