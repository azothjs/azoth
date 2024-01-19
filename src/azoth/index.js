import { rendererById } from './dom';
import { compose } from './compose.js';

export const _ = () => { };

// injected by compiler:
export {
    rendererById as __rendererById,
    compose as __compose
};