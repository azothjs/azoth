const QUERY_SELECTOR = '[data-bind]';
export const DOMRenderer = {
    name: 'DOMRenderer',

    createTemplate(id, content, isFragment) {
        const node = DOMRenderer.template(id, content);
        const render = DOMRenderer.renderer(node, isFragment);
        return render;
    },

    template(id, content) {
        if(content) return DOMRenderer.create(content);
        DOMRenderer.getById(id);
    },

    create(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    },
    getById(id) {
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
