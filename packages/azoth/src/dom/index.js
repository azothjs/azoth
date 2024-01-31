const templates = new Map();

export function clearTemplates() {
    templates.clear();
}

export function makeRenderer(id, html, isFragment = false) {
    if(templates.has(id)) return templates.get(id);

    const template = document.createElement('template');
    template.innerHTML = html;

    return rendererFactory(id, template.content, isFragment);
}

export function rendererById(id, isFragment = false) {
    if(templates.has(id)) return templates.get(id);

    // TODO: could fail on bad id...
    const templateEl = document.getElementById(id);
    return rendererFactory(id, templateEl.content, isFragment);

}

function rendererFactory(id, node, isFragment) {
    const template = renderer(node, isFragment);
    templates.set(id, template);
    return template;
}

export const ROOT_PROPERTY = 'root';
export const TARGETS_PROPERTY = 'targets';

function renderer(fragment, isFragment) {

    return function render() {
        const clone = fragment.cloneNode(true);
        const targets = clone.querySelectorAll('[data-bind]');
        const root = isFragment ? clone : clone.firstElementChild;

        return { root, targets };
    };
}