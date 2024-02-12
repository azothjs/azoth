import revHash from 'rev-hash';

export class Template {
    isDomFragment = false;
    isEmpty = false;
    isStatic = false;
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

    constructor(node, { bindings, boundElements, needs }) {
        this.node = node;
        this.bindings = bindings;
        this.boundElements = boundElements;
        this.needs = needs;

        if(node.isComponent && bindings.length) {
            throw new Error('Unexpected component binding length');
        }

        this.isDomFragment = node.isJSXFragment;
        this.isEmpty = node.isComponent ||
            (node.isJSXFragment && node.children.length === 0);
        this.isStatic = this.isEmpty || (!boundElements.length) && node.queryIndex !== -1;
    }
}
