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

    constructor(node, { isJsxFragment, bindings, boundElements }) {
        this.node = node;
        this.bindings = bindings;
        this.boundElements = boundElements;

        // used jsx <>...</> tags
        if(isJsxFragment) {
            const { queryIndex, children } = node;
            // <>{...}</> - bound childNode(s): 
            const isBound = queryIndex === -1;
            // <></>
            const noChildren = children.length === 0;
            // <><div></div></>
            const oneChild = children.length === 1;
            // <><div></div><hr/>text</> - multiple jsx children
            // multiple: children.length > 1;

            this.isEmpty = noChildren;
            this.isDomFragment = isBound || !oneChild;
        }
    }
}
