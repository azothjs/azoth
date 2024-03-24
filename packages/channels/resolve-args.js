import { OptionMissingFunctionArgumentError } from './throw.js';

export function resolveArgs(transform, options) {
    if(!options && typeof transform === 'object') {
        options = transform;
        transform = null;
    }

    const init = options?.init;
    const start = options?.start;
    const map = !!options?.map;
    const reduce = options?.reduce;

    if(map && !transform) {
        throw new OptionMissingFunctionArgumentError();
    }

    return {
        transform,
        init, start, map,
        reduce,
        hasStart: start !== undefined,
        hasInit: init !== undefined,
    };
}
