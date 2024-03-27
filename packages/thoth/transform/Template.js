import { generate } from 'astring';
import { createHash } from './create-hash.js';
import { HtmlGenerator } from './HtmlGenerator.js';

const generator = new HtmlGenerator();
const htmlGenerator = node => generate(node, { generator });

export class Template {
    tMap = null;
    bMap = null;
    pMap = null;

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

        if(!this.isStatic) {
            let propIndex = 0;
            const propMap = new Map();
            this.bMap = bindings.map(({ type, node }) => {
                if(type === 'child') return 0;
                if(type === 'spread') return 2;
                if(type === 'prop') {
                    const prop = node.name.name;
                    let index = propMap.has(prop)
                        ? propMap.get(prop)
                        : (propMap.set(prop, propIndex), propIndex++);
                    return [1, index];
                }
            });
            if(propMap.size) this.pMap = [...propMap.keys()];
            this.tMap = bindings.map(({ type, index, element: { isRoot, queryIndex } }) => {
                return type === 'child'
                    ? (isRoot ? [index] : [queryIndex, index])
                    : queryIndex;
            });
        }

        this.targetKey = this.tMap ? createHash(this.tMap.join()) : '';
        this.bindKey = this.bMap ? createHash(this.bMap.join()) : '';
        this.id = createHash(this.html + this.bindKey + this.targetKey);

    }
}
