import { isValidESIdentifier } from 'is-valid-es-identifier';
import { BIND } from './Template.js';

export function makeTargets(template) {
    const { boundElements, bindings, isStatic } = template;
    const { length: elLength } = boundElements;
    if(isStatic) return 'null';

    const values = bindings.map(({ element, type, index }) => {
        const { isRoot, queryIndex } = element;
        const target = isRoot ? 'r' : `${'t'}[${queryIndex}]`;
        return type === BIND.CHILD ? `${target}.childNodes[${index}]` : target;
    });

    return elLength ? `(r,t) => [${values.join()}]` : `r => [${values.join()}]`;
}

export function makeRenderer({ isEmpty, id, targetKey, tMap, bindKey, bMap, isDomFragment, html }, options) {
    if(isEmpty) return `null`;

    const content = !options?.noContent;
    const target = targetKey ? `g${targetKey}` : `null`;
    const bind = bindKey ? `b${bindKey}` : `null`;
    let renderer = `__renderer(`;
    renderer += `"${id}", /* ${JSON.stringify(tMap)} */ ${target}, /* ${JSON.stringify(bMap)} */ ${bind}, ${isDomFragment}`;
    if(content) renderer += ', `' + `${html}` + '`';
    renderer += `)`;

    return renderer;
}

const TARGETS = 'ts';
const TARGET = 't';
const VALUE = 'v';
// reserved, child, component, prop, spread
const METHOD = ['', '__c', '__cC', '', 'Object.assign'];

export function makeBind({ isStatic, bindings }) {
    if(isStatic) return 'null';

    const targets = [], params = [];
    for(let i = 0; i < bindings.length; i++) {
        targets.push(`${TARGET}${i} = ${TARGETS}[${i}]`);
        params.push(`${VALUE}${i}`);
    }

    const bound = bindings.map(({ type, node }, index) => {
        if(type !== BIND.PROP) {
            return `${METHOD[type]}(${TARGET}${index}, ${VALUE}${index});`;
        }

        // TODO: consider source maps for prop on element
        // TODO: DOMProp/attr lookup, camel vs '-', etc., exceptions
        const identity = node.name;
        let propName = identity.name;
        let target = `${TARGET}${index}`;
        if(propName.startsWith('data-')) {
            target += `.dataset`;
            propName = propName.slice(5);
        }
        const isValidId = isValidESIdentifier(propName);
        const refinement = isValidId ? `.${propName}` : `["${propName}"]`;

        return `${target}${refinement} = ${VALUE}${index};`;
    });

    return `(${TARGETS}) => {
  const ${targets.join(', ')};
  return (${params.join(', ')}) => {
    ${bound.join('\n    ')}
  };    
}`;

}
