/**
 * Shared abort plumbing for async-source consumption (compose + Channel).
 * `aborted(signal)` resolves to the ABORTED sentinel when the signal fires —
 * raced against a pull so a teardown (source switch, slot clear) interrupts
 * a parked await instead of waiting for the abandoned source's next value.
 */
export const ABORTED = Symbol('azoth.aborted');

export function aborted(signal) {
    return new Promise(resolve => {
        if(signal.aborted) resolve(ABORTED);
        else signal.addEventListener('abort', () => resolve(ABORTED), { once: true });
    });
}
