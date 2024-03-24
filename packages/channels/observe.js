import { generator } from './generator.js';
import { TransformNotFunctionArgumentError } from './throw.js';

export function observe(transform, init) {
    if(transform && typeof transform !== 'function') {
        throw new TransformNotFunctionArgumentError(transform);
    }
    return generator(transform, { init });
}
