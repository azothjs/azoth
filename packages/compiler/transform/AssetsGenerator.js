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

export function makeGetBound({ id, isDomFragment, html }, options) {
    const content = options?.noContent ? '' : `, ${html}`;
    return `const getBound = renderer('${id}', targets, bind, ${isDomFragment}${content});\n`;
}

export function makeRender({ bindings: { length } }) {
    const params = Array.from({ length }, (_, i) => `p${i}`);
    return `function renderDOM(${params}) {
  const [root, bind] = getBound();
  bind(${params});
  return root;
}\n`;
}