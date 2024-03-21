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

    return `const targets = (${elLength ? 'r,t' : 'r'}) => [${values.join()}];\n`;
}

export function makeRenderer({ id, isDomFragment, html }, options) {
    const content = options?.noContent ? '' : `, ${html}`;
    return `const renderDOM = renderer('${id}', targets, bind, ${isDomFragment}${content});\n`;
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
        if(node.isComponent) {
            throw new Error('need compose element');
            // return ComposeElement(node, expr, i, state);
        }
        if(type === 'child') {
            return `compose(${TARGET}${index}, ${VALUE}${index});`;
        }
        if(type === 'prop') {
            // TODO: consider source maps for prop on element
            // TODO: refactor with component props names
            const identity = node.name;
            const propName = identity.name;
            const isValidId = isValidESIdentifier(propName);
            const refinement = isValidId ? `.${propName}` : `[${propName}]`;

            return `${TARGET}${index}${refinement} = ${VALUE}${index};`;

        }
        const message = `Unexpected binding type "${type}", expected "child" or "prop"`;
        throw new Error(message);
    });

    return `function bind(${TARGETS}) {
  const ${targets.join(', ')};
  return (${params.join(', ')}) => {
    ${bound.join('\n    ')}
  };    
}\n`;

}
