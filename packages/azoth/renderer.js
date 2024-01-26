
/** 
 * Manually update until I can prove cost of 
 * { [ROOT_PROPERTY]: clone } doesn't matter
*/
export const ROOT_PROPERTY = 'root';
export const TARGETS_PROPERTY = 'targets';

export default function renderer(fragment) {

    return function render() {
        const clone = fragment.cloneNode(true);
        return {
            root: clone,
            targets: clone.querySelectorAll('[data-bind]')
        };
    };
}