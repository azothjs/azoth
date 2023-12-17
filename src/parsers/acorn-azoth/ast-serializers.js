import { Node } from 'acorn';
import { generate } from 'astring';

export default function addSerializers(expect, { log = false } = {}) {
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
        const buckets = bucketEntries(obj);

        let out = `${indentation}${obj.constructor.name}`;
        const childIndent = indentation + config.indent;
        
        const exclude = config.excludeKeys;
        config.excludeKeys = false;
        out += printBuckets(buckets, config, childIndent, depth, refs, printer);
        config.excludeKeys = exclude;

        return out;
    },
};

export const node = { 
    name: 'node',
    test: val => (val instanceof Node),
    serialize(node, config, indentation, depth, refs, printer) {
        const data = { 
            type: node.type, 
            buckets: bucketEntries(node) 
        };
        return printNode(data, config, indentation, depth, refs, printer);
    },
};

export const binding = {
    name: 'bind',
    test: val => node.test(val) && val.type === 'AzothBinding',
    serialize(binding, config, indentation, depth, refs, printer) {
        const { binder, expression } = binding;

        // binders right align visually
        // $ gets escaped, ends up as \$ so back into prior indent
        const indent = binder === '${' ? indentation.slice(0, -1) : indentation;

        const lines = generate(expression).split('\n');
        let [firstLine] = lines;
        if(lines.length > 1) firstLine += ` ...+${lines.length - 1}`;

        return `${indent}${binder.padStart(2, ' ')} ${firstLine}`;
    }
};

// order matters, pretty-format tests bottom up
const serializers = [
    object,
    node,
    templateElement,
    binding,
    array,
    string,
];

function bucketEntries(obj) {
    const objects = [], arrays = [], primitives = [];
    for(const entry of Object.entries(obj)){
        const [, val] = entry;        
        const bucket = array.test(val) ? arrays : (object.test(val) ? objects : primitives);
        bucket.push(entry);
    }
    return { objects, arrays, primitives };
}

function printNode({ type, buckets }, config, indentation, depth, refs, printer) {
    let out = `${indentation}${type}`;
    buckets.primitives = buckets.primitives.filter(([key]) => key !== 'type');

    const childIndent = indentation + config.indent;
    const exclude = config.excludeKeys;
    config.excludeKeys = new Set(['type', 'sourceType', 'start', 'end']);
    out += printBuckets(buckets, config, childIndent, depth, refs, printer);
    config.excludeKeys = exclude;

    delete config.excludeKeys;
    return out;
}

function printBuckets({ primitives, objects, arrays, }, config, indentation, depth, refs, printer) {
    return [
        printPrimitives(primitives, config, '', depth, refs, printer),
        printObjects(objects, config, indentation, depth, refs, printer),
        printChildArrays(arrays, config, indentation, depth, refs, printer),
    ].join('');
}

function printPrimitives(primitives, config, indentation, depth, refs, printer) {
    if(!primitives.length) return '';

    if(config.excludeKeys) {
        primitives = primitives.filter(([key]) => !config.excludeKeys.has(key));
    }
    
    const printProp = val => printer(val, config, '', depth, refs);
    const formatted = ' ' + primitives
        .map(([key, val]) => `${key}=${printProp(val)}`)
        .join(' ');

    return formatted;
}

function printObjects(objects, config, indentation, depth, refs, printer) {
    if(!objects.length) return '';

    const printNode = object => printer(object, config, indentation, depth, refs);
    return objects.map(([key, val]) => {
        const pn = printNode(val).trimStart();
        return `\n${indentation}${key} ${pn}`;
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

let count = 0;
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