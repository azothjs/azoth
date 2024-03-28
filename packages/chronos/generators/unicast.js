import { generator } from './generator.js';
import { TransformNotFunctionArgumentError } from '../throw.js';

export function unicast(transform, init) {
    if(typeof transform !== 'function') {
        if(init !== undefined) {
            throw new TransformNotFunctionArgumentError(transform, { method: 'unicast' });
        }

        init = transform;
        transform = null;
    }

    return generator(transform, { init });
}
