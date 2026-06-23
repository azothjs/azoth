import { isValidESIdentifier } from 'is-valid-es-identifier';
import { BIND } from './Template.js';

export function makeTargets(template) {
    const { boundElements, bindings, isStatic } = template;
    const { length: elLength } = boundElements;
    if(isStatic) return 'null';

    const values = bindings
        .map(({ element, type, index }) => {
            const { isRoot, queryIndex } = element;
            const target = isRoot ? 'r' : `${'t'}[${queryIndex}]`;
            const isComposed = type === BIND.CHILD || type === BIND.COMPONENT;
            return isComposed ? `${target}.childNodes[${index}]` : target;
        })
        .join(',');

    return elLength ? `(r,t) => [${values}]` : `r => [${values}]`;
}

export function makeRenderer({ isEmpty, id, targetKey, tMap, bindKey, bMap, isDomFragment, html }, options) {
    if(isEmpty) return `null`;

    const content = !options?.noContent;
    const target = targetKey ? `g${targetKey}` : `null`;
    const bind = bindKey ? `b${bindKey}` : `null`;
    let renderer = `__render(`;
    renderer += `"${id}", ${target}, ${bind}, ${isDomFragment}`;
    if(content) renderer += ', `' + `${html}` + '`';
    renderer += `)`;

    return renderer;
}

const TARGETS = 'ts';
const TARGET = 't';
const VALUE = 'v';
// reserved, child, component, prop, spread
const METHOD = ['', '__compose', '__composeComponent', '', 'Object.assign'];

export function makeBind({ isStatic, bindings }) {
    if(isStatic) return 'null';

    const targets = [], params = [];
    for(let i = 0; i < bindings.length; i++) {
        targets.push(`${TARGET}${i} = ${TARGETS}[${i}]`);
        params.push(`${VALUE}${i}`);
    }

    const bound = bindings.map(({ type, dom }, index) => {
        if(type !== BIND.PROP) {
            return `${METHOD[type]}(${TARGET}${index}, ${VALUE}${index});`;
        }

        // dom-info resolved the channel (Analyzer.#bind).
        // TODO: consider source maps for prop on element
        const target = `${TARGET}${index}`;
        const value = `${VALUE}${index}`;
        switch(dom.kind) {
            case 'property': {
                const refinement = isValidESIdentifier(dom.name)
                    ? `.${dom.name}` : `["${dom.name}"]`;
                return `${target}${refinement} = ${value};`;
            }
            case 'attribute':
                return `${target}.setAttribute("${dom.name}", ${value});`;
            case 'attributeNS':
                return `${target}.setAttributeNS("${dom.ns}", "${dom.name}", ${value});`;
        }
    });

    return `(${TARGETS}) => {
  const ${targets.join(', ')};
  return (${params.join(', ')}) => {
    ${bound.join('\n    ')}
  };    
}`;

}
