import { generator } from './generator.js';
import { TransformNotFunctionArgumentError } from '../throw.js';

/**
 * reduce(reducer, init?, initialAction?) → [asyncIterator, dispatch]
 *
 * Reducer pattern over an async iterator. Each dispatch passes through
 * the reducer with the running state. The async iterator yields each
 * new state.
 *
 *   const [iter, dispatch] = reduce((state, action) => state + action, 0);
 *   dispatch(2);   // iter yields 2
 *   dispatch(3);   // iter yields 5
 *
 * If you need the initial state for synchronous rendering, you have it
 * in scope (you passed it in as `init`). chronos does not assume any
 * particular rendering library — pair the iterator with an initial
 * value at your downstream layer if you need one.
 */
export function reduce(reducer, init, initialAction = null) {
    if(reducer && typeof reducer !== 'function') {
        throw new TransformNotFunctionArgumentError(reducer, {
            method: 'reduce',
            param: 'reducer'
        });
    }

    let state = reducer(init, initialAction);
    return generator(action => state = reducer(state, action));
}
