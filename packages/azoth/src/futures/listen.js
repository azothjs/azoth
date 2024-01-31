import { subject } from './generators.js';

export function broadcast() {
    const listeners = [];

    function emit(value) {
        for(let listener of listeners) {
            listener(value);
        }
    }

    function add(initial, transform) {
        const [signal, iterator] = subject(initial, transform);
        listeners.push(signal);
        return iterator;
    }

    return [emit, add];
}

export function pubsub() {
    const set = new Set();

    function publish(value) {
        for(const subscriber of set.values()) {
            subscriber(value);
        }
    }

    function subscribe(subscriber, initial, transform) {
        set.add(subscriber);
        if(initial)
            return () => set.remove(subscriber);
    }

    return [publish, subscribe];
}

