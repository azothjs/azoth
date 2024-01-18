import renderer from './renderer';

const htmlToFragment = html => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
};

export const rawHtml = htmlToFragment;

export const makeRenderer = html => {
    const fragment = htmlToFragment(html);
    return renderer(fragment);
};

export function renderById(id) {
    const template = getRenderer(id);
    return template();
}

const templates = new Map();

export const getRenderer = id => {
    if(templates.has(id)) return templates.get(id);

    // TODO: could fail on bad id...
    const templateEl = document.getElementById(id);
    const template = renderer(templateEl.content);

    templates.set(id, template);
    return template;
};