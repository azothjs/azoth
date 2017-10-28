let range = null;
export const rawHtml = html => {
    if(!range) range = document.createRange();
    range.createContextualFragment(html);
};

export const makeTemplate = html => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
};