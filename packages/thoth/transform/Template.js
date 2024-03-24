import { generate } from 'astring';
import revHash from 'rev-hash';
import { HtmlGenerator } from './HtmlGenerator.js';

const generator = new HtmlGenerator();
const htmlGenerator = node => generate(node, { generator });

export class Template {

    constructor(node, { bindings, boundElements, imports }) {
        if(node.isComponent && bindings.length) {
            throw new Error('Unexpected component binding length');
        }

        this.node = node;
        this.bindings = bindings;
        this.boundElements = boundElements;
        this.imports = imports;
        this.isBoundRoot = node.queryIndex === -1;
        this.isDomFragment = node.isJSXFragment;
        this.isEmpty = node.isComponent ||
            (node.isJSXFragment && node.children.length === 0);
        this.isStatic = this.isEmpty || (!boundElements.length) && node.queryIndex !== -1;

        this.html = this.isEmpty ? '' : htmlGenerator(node);

        let tKey = '', bKey = '';
        if(!this.isStatic) {
            tKey = revHash(bindings.map(({ type, index, element: { isRoot, queryIndex } }) => {
                return (isRoot ? '' : `${queryIndex}`) + (type === 'child' ? `:${index}` : '');
            }).join());
            bKey = revHash(bindings.map(({ type, node }) => {
                return type === 'prop' ? node.name.name : '';
            }).join());
        }

        this.targetKey = tKey;
        this.bindKey = bKey;
        this.id = revHash(this.html + this.bindKey + this.targetKey);

    }
}
