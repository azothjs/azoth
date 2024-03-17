const QUERY_SELECTOR = '[data-bind]';
export const DOMRenderer = {
    name: 'DOMRenderer',
    make(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    },
    get(id) {
        const template = document.getElementById(id);
        if(!template) {
            throw new Error(`No template with id "${id}"`);
        }
        return template.content;
    },
    renderer(fragment, isFragment) {
        if(!isFragment) fragment = fragment.firstElementChild;
        // TODO: malformed fragment check...necessary?

        return function render() {
            const clone = fragment.cloneNode(true);
            const targets = clone.querySelectorAll(QUERY_SELECTOR);
            return [clone, targets];
        };
    },
    bound(dom) {
        return dom.querySelectorAll(QUERY_SELECTOR);
    }
};
