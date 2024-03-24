import { Sync } from '../maya/compose/compose.js';
import { generator } from './generator.js';
import { TransformNotFunctionArgumentError } from './throw.js';

export function reduce(reducer, init, initialAction = null) {
    if(reducer && typeof reducer !== 'function') {
        throw new TransformNotFunctionArgumentError(reducer, { method: 'reduce', param: 'reducer' });
    }

    let state = reducer(init, initialAction);
    const [iter, dispatch] = generator(action => state = reducer(state, action));
    return [Sync.wrap(state, iter), dispatch];
}
