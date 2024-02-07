import { subject } from './generators.js';

export function broadcast() {
    const listeners = [];

    function signal(value) {
        for(let listener of listeners) {
            listener(value);
        }
    }

    function join(initial, transform) {
        const [signal, iterator] = subject(initial, transform);
        listeners.push(signal);
        return iterator;
    }

    return [signal, join];
}

export function pubsub() {
    const set = new Set();

    function publish(value) {
        for(const subscriber of set.values()) {
            subscriber(value);
        }
    }

    function subscribe(subscriber) {
        set.add(subscriber);
        return () => set.remove(subscriber);
    }

    return [publish, subscribe];
}

