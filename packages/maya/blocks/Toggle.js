export function Toggle({ on: predicate }, slottable) {
    return payload => predicate(payload) ? slottable : null;
}
