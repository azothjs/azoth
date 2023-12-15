import { Node } from 'acorn';

// Type tests
const isAstNode = val => val instanceof Node;
const isArray = Array.isArray;
const pojoProto = Object.getPrototypeOf({});
const isPojo = val => {
    if(!val || typeof val !== 'object') return false;
    return Object.getPrototypeOf(val) === pojoProto;
};

//serializers
export const pojoSerializer = {
    name: 'pojo',
    test: isPojo,
    serialize: JSON.stringify
};

export const arraySerializer = {
    name: 'array',
    test: isArray,
    serialize: serializeArray,
};

export const nodeSerializer = { 
    name: 'node',
    test: isAstNode,
    serialize: serializeNode, 
};

export const tmplElSerializer = {
    name: 'tmpEl',
    test: val => isAstNode(val) && val.type === 'TemplateElement',
    serialize: serializeTmplEl
};

// order matters, pretty-format tests bottom up
const serializers = [
    pojoSerializer,
    arraySerializer,
    nodeSerializer,
    tmplElSerializer
];

export default function addSerializers(expect, { printLog = false } = {}) {
    serializers.forEach(s => {
        if(printLog) s = wrap(s);
        expect.addSnapshotSerializer(s);
    });
}

const excludeKeys = new Set(['type', 'sourceType', 'start', 'end']);

function bucketChildren(node) {
    const props = [], nodes = [], arrays = [];
    for(const entry of Object.entries(node)){
        const [, val] = entry;
        const bucket = isAstNode(val) ? nodes : (isArray(val) ? arrays : props);
        bucket.push(entry);
    }
    return { props, nodes, arrays };
}

export function serializeNode(node, config, indentation, depth, refs, printer) {
    // Bucket [key, value] entries by kind of child
    const { props, nodes, arrays } = bucketChildren(node);

    let out = '';

    const printProp = val => printer(val, config, '', depth, refs);
    const formatted = props
        .filter(([key]) => !excludeKeys.has(key))
        .map(([key, val]) => ` ${key}: ${printProp(val)}`)
        .join(',');
    out += `${indentation}${node.type}${formatted}`;
    const childIndent = indentation + config.indent;

    const printNode = node => printer(node, config, childIndent, depth, refs);
    out += nodes.map(([key, val]) => { 
        const pn = printNode(val).trimStart();
        let out = `\n${childIndent}${key}: ${pn}`;
        return out;
    });
            
    const printArray = arr => printer(arr, config, childIndent, depth, refs);
    out += arrays.map(([key, val]) => {
        let out = `\n${childIndent}${key}[`;
        const printedArray = printArray(val);
        if(printedArray) {
            out += `\n${printedArray}\n${childIndent}`; 
        }
        out += ']';
        return out;
    }).join('');
        
    return out;
} 

function serializeArray(array, config, indentation, depth, refs, printer) {
    if(!array?.length) return '';

    indentation += config.indent;
    return array.map(each => {
        return printer(each, config, indentation, depth, refs);
    }).join('\n');
}

function serializeTmplEl({ type, value }, config, indentation) {
    return `${indentation}${type} '${value.raw}'`;
}


const log = (type, name = '', val, result = '') => {
    let displayValue = isArray(val) ? `[${'.'.repeat(val.length)}]` : (val?.type || val);
    // eslint-disable-next-line no-console
    console.log(
        type.padEnd(6, ' '), 
        name.padEnd(6, ' '), 
        result.toString().padEnd(6, ' '), 
        displayValue
    );
};
const logTest = (name, val, result) => {
    log('test', name, val, result ? 'pass' : 'fail');
};
const logSerialize = (name, val) => {
    log('print', name, val);
};

let count = 0;
function wrap({ name = `s${count++}`, test, serialize }) {
    return {
        test(val) {
            const pass = test(val);
            logTest(name, val, pass);
            return pass;
        },
        serialize(val, config, indentation, depth, refs, printer) {
            logSerialize(name, val);
            return serialize(val, config, indentation, depth, refs, printer);
        }
    };
}