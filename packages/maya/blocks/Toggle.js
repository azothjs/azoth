export function Toggle({ on: predicate }, childNodes) {
    return payload => predicate(payload) ? childNodes : null;
}
