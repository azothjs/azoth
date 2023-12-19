import { Node } from 'acorn';
import { generate } from 'astring';

let excluded = [];
export default function addSerializers(expect, { 
    log = false, 
    excludeKeys = ['type', 'start', 'end'] 
} = {}) {
    excluded = excludeKeys;
    serializers.forEach(s => {
        if(log) s = wrap(s);
        expect.addSnapshotSerializer(s);
    });
}

export const string = {
    name: 'string',
    test: s => typeof s === 'string',
    serialize(string, config, indentation, depth, refs, printer) {
        return `'${string}'`;
    },
};

export const templateElement = {
    name: 'tmplEl',
    test: val => node.test(val) && val.type === 'TemplateElement',
    serialize({ type, value }, config, indentation) {
        return `${indentation}'${value.raw.replaceAll('\n', '⏎')}'`;
    },
};

export const array = {
    name: 'array',
    test: Array.isArray,
    serialize(array, config, indentation, depth, refs, printer) {
        if(!array.length) return '[]';
    
        const childIndentation = indentation + config.indent;
        return `[\n${array
            .map(each => printer(each, config, childIndentation, depth, refs))
            .join('\n')
        }\n${indentation}]`;
    },
};

export const object = {
    name: 'object',
    test: o => !!o && typeof o === 'object',
    serialize(obj, config, indentation, depth, refs, printer) {        
        const excludes = [...excluded];
        let out = indentation;
        let objName = obj.constructor.name;
        if(objName === 'Object') objName = '';
        const hasType = !objName && obj.type;
        if(hasType) {
            objName = obj.type;
            excludes.push('type');
        }
        out += objName;

        const buckets = bucketEntries(obj, excludes);
        const childIndent = indentation + config.indent;
        out += printBuckets(buckets, config, childIndent, depth, refs, printer);

        return out;
    },
};

export const node = { 
    name: 'node',
    test: val => (val instanceof Node),
    serialize(node, config, indentation, depth, refs, printer) {
        const data = { 
            type: node.type, 
            buckets: bucketEntries(node, ['type', ...excluded]) 
        };
        return printNode(data, config, indentation, depth, refs, printer);
    },
};

export const binding = {
    name: 'bind',
    test: val => node.test(val) && val.type === 'AzothBinding',
    serialize(binding, config, indentation, depth, refs, printer) {
        const { expression: expr, ...rest } = binding;

        const lines = generate(expr).split('\n');
        let [expression] = lines;
        if(lines.length > 1) expression += ` ...+${lines.length - 1}`;

        return printer({ ...rest, expression }, config, indentation, depth, refs);
    }
};

// order matters, pretty-format tests bottom up
const serializers = [
    // object,
    // node,
    // templateElement,
    // binding,
    // array,
    // string,
];

function bucketEntries(obj, excludeKeys = []) {
    const objects = [], arrays = [], primitives = [];
    for(const entry of Object.entries(obj)){
        const [key, val] = entry;        
        if(excludeKeys && excludeKeys.includes(key)) continue;
        const bucket = array.test(val) ? arrays : (object.test(val) ? objects : primitives);
        bucket.push(entry);
    }
    return { objects, arrays, primitives };
}

function printNode({ type, buckets }, config, indentation, depth, refs, printer) {
    let out = `${indentation}${type}`;
    const childIndent = indentation + config.indent;
    out += printBuckets(buckets, config, childIndent, depth, refs, printer);
    return out;
}

function printBuckets({ primitives, objects, arrays, }, config, indentation, depth, refs, printer) {
    return [
        printPrimitives(primitives, config, indentation, depth, refs, printer),
        printObjects(objects, config, indentation, depth, refs, printer),
        printChildArrays(arrays, config, indentation, depth, refs, printer),
    ].join('');
}

function printPrimitives(primitives, config, indentation, depth, refs, printer) {
    if(!primitives.length) return '';
    
    const printProp = val => printer(val, config, '', depth, refs);
    const formatted = primitives
        .map(([key, val]) => {
            return `\n${indentation}${key}: ${printProp(val)}`;
        })
        .join('');

    return formatted;
}

function printObjects(objects, config, indentation, depth, refs, printer) {
    if(!objects.length) return '';

    const printNode = object => printer(object, config, indentation, depth, refs);
    return objects.map(([key, val]) => {
        const printed = printNode(val);
        return `\n${indentation}${key}: ${printed}`;
    });
}

function printChildArrays(arrays, config, indentation, depth, refs, printer) {
    if(!arrays.length) return '';

    const printArray = array => printer(array, config, indentation, depth, refs);
    return arrays
        .map(([key, val]) => `\n${indentation}${key}: ${printArray(val)}`)
        .join('');
}

const log = (type, name = '', val, result = '') => {
    let displayValue = Array.isArray(val) ? `[${'.'.repeat(val.length)}]` : (val?.type || val);
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

function wrap({ test, serialize, name = serialize.name }) {
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