export const $anchor = (text = '0') => document.createComment(text);
export const $text = (text) => document.createTextNode(text);
export const $element = (text) => {
    const div = document.createElement('div');
    if(text !== undefined) div.textContent = text;
    return div;
};
export const $helloText = () => $text('Hello');

export function elementWithText(text = 'hello') {
    const dom = $element();
    dom.append($text(text));
    return { dom, anchor: null };
}

export function elementWithTextAnchor() {
    const dom = $element();
    dom.append($helloText(), $anchor());
    return { dom, anchor: dom.lastChild };
}

export function elementWithTextAnchorText() {
    const dom = $element();
    dom.append($helloText(), $anchor(), $helloText());
    return { dom, anchor: dom.firstChild.nextSibling };
}

export function elementWithAnchor() {
    const dom = $element();
    dom.append($anchor());
    return { dom, anchor: dom.firstChild };
}

export function elementWithAnchorText() {
    const dom = $element();
    dom.append($anchor(), $helloText());
    return { dom, anchor: dom.firstChild };
}

export const elements = [
    elementWithTextAnchor,
    elementWithTextAnchorText,
    elementWithAnchor,
    elementWithAnchorText,
];
