import { Sync } from '../maya/compose/compose.js';
import { generator } from './generator.js';
import { resolveArgs } from './resolve-args.js';
import { TransformNotFunctionArgumentError } from './throw.js';


export function reduce(reducer, init) {
    if(reducer && typeof reducer !== 'function') {
        throw new TransformNotFunctionArgumentError(reducer);
    }

    return generator(reducer, { init, reducer: true });
}
