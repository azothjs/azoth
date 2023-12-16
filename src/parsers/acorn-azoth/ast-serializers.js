import { Node } from 'acorn';
import { generate } from 'astring';

// class CodeExpression {
//     constructor(expr, binding, config, indentation) {
//         const code = generate(expr);
//         const lines = code.split('\n');
//         let [firstLine] = lines;
//         if(lines.length > 1) firstLine += ` ...+${lines.length - 1}`;
//         let prefix = config.indent;
//         if(binding) {
//             if(binding === '#{') prefix = '  ' + binding;
//             else if(binding === '{') prefix = '   ' + binding;
//             // ${ outputs escaped as \${ so no adjustment
//             else prefix = ' ' + binding;
//             firstLine = `${prefix}  ${firstLine}`;
//         }
//         else {
//             firstLine = `${prefix}${firstLine}`;
//         }

        
//         this.code = firstLine;
//     }
// }

// function serializeCodeExpr({ code }, config, indentation) {
//     return `${indentation.slice(0, -config.indent.length)}${code}`;
// }


// const pojoProto = Object.getPrototypeOf({});
// const isPojo = val => {
//     if(!val || typeof val !== 'object') return false;
//     return Object.getPrototypeOf(val) === pojoProto;
// };

//serializers
// export const pojoSerializer = {
//     name: 'pojo',
//     test: isPojo,
//     serialize: JSON.stringify
// };

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

// export const templateLiteral = {
//     name: 'tmplLit',
//     test: val => node.test(val) && val.type === 'TemplateLiteral',
//     serialize(node, config, indentation, depth, refs, printer) {
//         const buckets = bucketEntries(node);
//         const exprEntry = buckets.arrays.find(([key]) => key === 'expressions');
//         const bindEntry = buckets.arrays.find(([key]) => key === 'bindings');
//         const bindings = bindEntry?.[1]; 
//         // if(exprEntry) {
//         //     exprEntry[1] = exprEntry[1].map((expr, i) => {
//         //         const binding = bindings ? bindings[i] : undefined;
//         //         return new CodeExpression(expr, binding, config, indentation);
//         //     });
//         // }
            
//         return printNode(({ type: node.type, buckets }, config, indentation, depth, refs, printer));      
//     }
// };


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

function bucketEntries(obj) {
    const objects = [], arrays = [], primitives = [];
    for(const entry of Object.entries(obj)){
        const [, val] = entry;        
        const bucket = array.test(val) ? arrays : (object.test(val) ? objects : primitives);
        bucket.push(entry);
    }
    return { objects, arrays, primitives };
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

// export const codeExprSerializer = {
//     name: 'code',
//     test: isCodeExpr,
//     serialize: serializeCodeExpr
// };

// order matters, pretty-format tests bottom up
const serializers = [
    // pojoSerializer,
    object,
    node,
    templateElement,
    array,
    string,
    // tmplLitSerializer,
    // codeExprSerializer,
];

export default function addSerializers(expect, { log = false } = {}) {
    serializers.forEach(s => {
        if(log) s = wrap(s);
        expect.addSnapshotSerializer(s);
    });
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