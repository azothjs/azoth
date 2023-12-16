import { Node } from 'acorn';
import { generate } from 'astring';

function formatMultiline(text) {
    const lines = text.split('\n');
    return lines[0] + lines.length > 1 ? '...' : '';
}
class CodeExpression {
    constructor(expr) {
        const code = generate(expr);
        const lines = code.split('\n');
        let [firstLine] = lines;
        if(lines.length > 1) firstLine += ` ...+${lines.length - 1}`;
        this.code = firstLine ;
    }
}

function serializeCodeExpr({ code }, config, indentation) {
    return `${indentation + config.indent}${code}`;
}

// Type tests
const instanceCheck = Constructor => val => val instanceof Constructor;
const isNode = instanceCheck(Node);
const isCodeExpr = instanceCheck(CodeExpression);
const testNodeType = type => val => isNode(val) && val.type === type;
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
    test: isNode,
    serialize: serializeNode, 
};

export const tmplElSerializer = {
    name: 'tmpEl',
    test: testNodeType('TemplateElement'),
    serialize: serializeTmplEl
};

export const tmplLitSerializer = {
    name: 'tmpLit',
    test: testNodeType('TemplateLiteral'),
    serialize: serializeTmplLit
};

export const codeExprSerializer = {
    name: 'code',
    test: isCodeExpr,
    serialize: serializeCodeExpr
};

// order matters, pretty-format tests bottom up
const serializers = [
    pojoSerializer,
    arraySerializer,
    nodeSerializer,
    tmplLitSerializer,
    tmplElSerializer,
    codeExprSerializer,
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
        const bucket = isNode(val) ? nodes : (isArray(val) ? arrays : props);
        bucket.push(entry);
    }
    return { props, nodes, arrays };
}

export function serializeNode(node, config, indentation, depth, refs, printer) {
    const buckets = bucketChildren(node);
    return printNode(buckets, node, config, indentation, depth, refs, printer);      
} 

function printNode(buckets, node, config, indentation, depth, refs, printer) {
    const { props, nodes, arrays } = buckets;
    
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
        let out = `\n${childIndent}${key} ${pn}`;
        return out;
    });

    const printArray = arr => printer(arr, config, childIndent, depth, refs);
    out += arrays.map(([key, val]) => {
        let out = `\n${childIndent}${key} [`;
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
    return `${indentation} '${value.raw.replaceAll('\n', '⏎')}'`;
}

function serializeTmplLit(node, config, indentation, depth, refs, printer) {
    const buckets = bucketChildren(node);
    const entry = buckets.arrays.find(([key]) => key === 'expressions');
    if(entry) {
        entry[1] = entry[1].map(expr => {
            return new CodeExpression(expr, indentation, config.indent);
        });
    }
    
    return printNode(buckets, node, config, indentation, depth, refs, printer);      
}

const log = (type, name = '', val, result = '') => {
    let displayValue = isArray(val) ? `[${'.'.repeat(val.length)}]` : (val?.type || val);
    // eslint-disable-next-line no-console
    console.log(
        type.padEnd(7, ' '), 
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