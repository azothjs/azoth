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

    const templateEl = document.getElementById(id);
    if(!templateEl) {
        throw new Error(`No template with id "${id}"`);
    }

    return rendererFactory(id, templateEl.content, isFragment);
}

function rendererFactory(id, node, isFragment) {
    const render = renderer(node, isFragment);
    templates.set(id, render);
    return render;
}

function renderer(fragment, isFragment) {
    if(!isFragment) fragment = fragment.firstElementChild;
    // TODO: malformed fragments...necessary?

    return function render() {
        const clone = fragment.cloneNode(true);
        const targets = clone.querySelectorAll('[data-bind]');
        return [clone, targets];
    };
}