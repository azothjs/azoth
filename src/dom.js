const range = document.createRange();
export const rawHtml = html => range.createContextualFragment(html);

const template = document.createElement('template');
export const makeTemplate = html => {
    template.innerHTML = html;
    return template.content;
};