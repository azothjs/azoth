import renderer from './renderer';

const htmlToFragment = html => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
};

export const makeRenderer = (id, html) => {
    if(templates.has(id)) return templates.get(id);
    const fragment = htmlToFragment(html);
    const template = renderer(fragment);
    templates.set(id, template);
    return template;
};

export function rendererById(id) {
    const renderer = getRenderer(id);;
    const { fragment, targets } = renderer();

    const { childElementCount, childNodes } = fragment;
    const node = childElementCount === 1 && childNodes.length === 1
        ? fragment.firstElementChild
        : fragment;

    return { node, targets };
}

const templates = new Map();

export function getRenderer(id:string) {
    if(templates.has(id)) return templates.get(id);

    // TODO: could fail on bad id...
    const templateEl = document.getElementById(id) as HTMLTemplateElement;
    const render = renderer(templateEl.content);
    templates.set(id, render);
    return render;
};