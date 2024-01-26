import renderer from './renderer.js';

const htmlToFragment = (html) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
};

export const makeRenderer = (id, html, isFragment = false) => {
    if(templates.has(id)) return templates.get(id);
    const fragment = htmlToFragment(html);
    const template = renderer(fragment, isFragment);
    templates.set(id, template);
    return template;
};

export function rendererById(id, isFragment = false) {
    const renderer = getRenderer(id);
    let { root, targets } = renderer();
    if(!isFragment) root = root.firstElementChild;
    return { root, targets };
}

const templates = new Map();

function getRenderer(id) {
    if(templates.has(id)) return templates.get(id);

    // TODO: could fail on bad id...
    const templateEl = document.getElementById(id);
    const template = renderer(templateEl.content);
    templates.set(id, template);
    return template;
}