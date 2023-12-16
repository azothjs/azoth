import { Node } from 'acorn';
import { generate } from 'astring';

class CodeExpression {
    constructor(expr, binding, config, indentation) {
        const code = generate(expr);
        const lines = code.split('\n');
        let [firstLine] = lines;
        if(lines.length > 1) firstLine += ` ...+${lines.length - 1}`;
        let prefix = config.indent;
        if(binding) {
            if(binding === '#{') prefix = '  ' + binding;
            else if(binding === '{') prefix = '   ' + binding;
            // ${ outputs escaped as \${ so no adjustment
            else prefix = ' ' + binding;
            firstLine = `${prefix}  ${firstLine}`;
        }
        else {
            firstLine = `${prefix}${firstLine}`;
        }

        
        this.code = firstLine;
    }
}

function serializeCodeExpr({ code }, config, indentation) {
    return `${indentation.slice(0, -config.indent.length)}${code}`;
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
        const [key, val] = entry;        
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
    const childIndent = indentation + config.indent;
    
    let out = '';
    out += printProps(props, node, config, indentation, depth, refs, printer);
    out += printNodeProps(nodes, config, childIndent, depth, refs, printer);
    out += printArrays(node, arrays, config, childIndent, depth, refs, printer);
    return out;
}

function printArrays(node, arrays, config, indentation, depth, refs, printer) {
    const printArray = arr => printer(arr, config, indentation, depth, refs);
    
    // hacky fix for not showing bindings on template literals
    let filtered = arrays;
    if(node.type === 'TemplateLiteral') {
        filtered = arrays.filter(([key]) => key !== 'bindings');
    }

    return filtered.map(([key, val]) => {
        let out = `\n${indentation}${key} [`;
        const printedArray = printArray(val);
        if(printedArray) {
            out += `\n${printedArray}\n${indentation}`;
        }
        out += ']';
        return out;
    }).join('');
}

function printNodeProps(nodes, config, indentation, depth, refs, printer) {
    const printNode = node => printer(node, config, indentation, depth, refs);
    return nodes.map(([key, val]) => {
        const pn = printNode(val).trimStart();
        return `\n${indentation}${key} ${pn}`;
    });
}

function printProps(props, node, config, indentation, depth, refs, printer) {
    const printProp = val => printer(val, config, '', depth, refs);
    const formatted = props
        .filter(([key]) => !excludeKeys.has(key))
        .map(([key, val]) => ` ${key}: ${printProp(val)}`)
        .join(',');
    return `${indentation}${node.type}${formatted}`;
}

function serializeArray(array, config, indentation, depth, refs, printer) {
    if(!array?.length) return '';

    indentation += config.indent;
    return array.map(each => {
        return printer(each, config, indentation, depth, refs);
    }).join('\n');
}

function serializeTmplEl({ type, value }, config, indentation) {
    return `${indentation}'${value.raw.replaceAll('\n', '⏎')}'`;
}

function serializeTmplLit(node, config, indentation, depth, refs, printer) {
    const buckets = bucketChildren(node);
    const exprEntry = buckets.arrays.find(([key]) => key === 'expressions');
    const bindEntry = buckets.arrays.find(([key]) => key === 'bindings');
    const bindings = bindEntry?.[1]; 
    if(exprEntry) {
        exprEntry[1] = exprEntry[1].map((expr, i) => {
            const binding = bindings ? bindings[i] : undefined;
            return new CodeExpression(expr, binding, config, indentation);
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