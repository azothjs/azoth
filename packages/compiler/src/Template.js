import revHash from 'rev-hash';

export class Template {
    isDomFragment = false;
    isEmpty = false;
    #html = '';
    #id = '';

    get id() {
        return this.#id;
    }
    get html() {
        return this.#html;
    }

    set html(html) {
        this.#html = html;
        this.#id = revHash(html);
    }

    constructor(node, { bindings, boundElements }) {
        this.node = node;
        this.bindings = bindings;
        this.boundElements = boundElements;

        this.isDomFragment = node.isJSXFragment;
        this.isEmpty = node.isComponent ||
            (node.isJSXFragment && node.children.length === 0);
    }
}
