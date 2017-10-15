const range = document.createRange();
export const rawHtml = html => range.createContextualFragment(html);

export const makeTemplate = html => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
};