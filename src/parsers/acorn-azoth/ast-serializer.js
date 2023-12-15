import { Node, Parser } from 'acorn';
import { test, expect } from 'vitest';
import acornAz from './acorn-az.js';

export function addSerializers(expect) {
    expect.addSnapshotSerializer(pojoSerializer);
    expect.addSnapshotSerializer(arraySerializer);
    expect.addSnapshotSerializer(nodeSerializer);
    expect.addSnapshotSerializer(tmplElSerializer);
}

const isAstNode = val => val instanceof Node;
const isArray = Array.isArray;

const excludeKeys = new Set(['type', 'sourceType', 'start', 'end']);

const nodeSerializer = { 
    test: val => {
        const isNode = isAstNode(val);
        // logTest('node', val, isNode);
        return isNode;
    }, 
    serialize(node, config, indentation, depth, refs, printer) {
        // logSrlz('node', node);
        const props = [], nodes = [], arrays = [];
        for(const entry of Object.entries(node)){
            const [, val] = entry;
            const bucket = isAstNode(val) ? nodes : (isArray(val) ? arrays : props);
            bucket.push(entry);
        }

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
};



const tmplElSerializer = {
    test: val => {
        const isTmplEl = isAstNode(val) && val.type === 'TemplateElement';
        // logTest('tmpl', val?.type ?? '', isTmplEl);
        return isTmplEl;
    },
    serialize(node, config, indentation, depth, refs, printer) {
        // logSrlz('tmpl', node.type);
        return `${indentation}${node.type} '${node.value.raw}'`;
    }
};

const arraySerializer = {
    test: val => {   
        const isArray = Array.isArray(val);
        // logTest('arr ', val, isArray);
        return isArray;
    },
    serialize(array, config, indentation, depth, refs, printer) {
        // logSrlz('arr ', array);
        if(!array?.length) return '';
        indentation += config.indent;
        return array.map(item => {
            return printer(item, config, indentation, depth, refs);
        }).join('\n');
    }
};

const pojoPrototype = Object.getPrototypeOf({});

const pojoSerializer = {
    test: val => {
        const isPojo = !!val & typeof val === 'object' && Object.getPrototypeOf(val) === pojoPrototype;
        // logTest('pojo', val, isPojo);
        return isPojo;
    },
    serialize(obj, config, indentation, depth, refs, printer) {
        // logSrlz('pojo', obj);
        return JSON.stringify(obj);
    }
};


const log = type => (name, val, result = '') => {
    let display = isArray(val) ? `[${'.'.repeat(val.length)}]` : (val?.type || val);
    // eslint-disable-next-line no-console
    console.log(type, name.toString().padEnd(5, ' '), result.toString().padEnd(5, ' '), display);
};
const logTest = log('test');
const logSrlz = log('srlz');

let count = 0;
function wrap({ name = `s${count++}`, test, serialize }) {

    return {
        test(val) {
            const pass = serializer.test(val);
            logTest();
        }
    };
}

// const tmplElSerializer = {
//     test: val => {
//         const isTmplEl = isAstNode(val) && val.type === 'TemplateElement';
//         // logTest('tmpl', val?.type ?? '', isTmplEl);
//         return isTmplEl;
//     },
//     serialize(node, config, indentation, depth, refs, printer) {
//         // logSrlz('tmpl', node.type);
//         return `${indentation}${node.type} '${node.value.raw}'`;
//     }
// };
