import { isValidESIdentifier } from 'is-valid-es-identifier';

export function makeTargets(template) {
    const { boundElements, bindings } = template;
    const { length: elLength } = boundElements;

    const values = bindings.map(({ element, type, index }) => {
        const { isRoot, queryIndex } = element;
        const target = isRoot ? 'r' : `${'t'}[${queryIndex}]`;
        return type === 'child'
            ? `${target}.childNodes[${index}]`
            : target;
    });

    return `(${elLength ? 'r,t' : 'r'}) => [${values.join()}]`;
}

export function makeRenderer({ id, targetKey, bindKey, isDomFragment, html }, options) {
    const content = !options?.noContent;
    const target = targetKey ? `g${targetKey}` : `null`;
    const bind = bindKey ? `b${bindKey}` : `null`;
    let renderer = `__renderer(`;
    renderer += `"${id}", ${target}, ${bind}, ${isDomFragment}`;
    if(content) renderer += `, \`${html}\``;
    renderer += `)`;

    return renderer;
}

const TARGETS = 'ts';
const TARGET = 't';
const VALUE = 'v';

export function makeBind({ bindings }) {
    const targets = [], params = [];
    for(let i = 0; i < bindings.length; i++) {
        targets.push(`${TARGET}${i} = ${TARGETS}[${i}]`);
        params.push(`${VALUE}${i}`);
    }

    const bound = bindings.map(({ type, node }, index) => {
        if(type === 'child') {
            return `__compose(${TARGET}${index}, ${VALUE}${index});`;
        }
        if(type === 'prop') {
            // TODO: consider source maps for prop on element
            // TODO: refactor with component props names when DOMProp/attr lookup exists
            const identity = node.name;
            const propName = identity.name;
            const isValidId = isValidESIdentifier(propName);
            const refinement = isValidId ? `.${propName}` : `[${propName}]`;

            return `${TARGET}${index}${refinement} = ${VALUE}${index};`;

        }
        const message = `Unexpected binding type "${type}", expected "child" or "prop"`;
        throw new Error(message);
    });

    return `(${TARGETS}) => {
  const ${targets.join(', ')};
  return (${params.join(', ')}) => {
    ${bound.join('\n    ')}
  };    
}`;

}
