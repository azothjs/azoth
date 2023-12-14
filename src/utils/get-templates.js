// test-util

import { simple } from 'acorn-walk';
import { parse } from './ast.js';

// TODO: option for function call
const isAzoth = node => node.tag?.name === '_';

export function getTemplatesAst(code) {
    if(typeof code === 'function') code = code.toCode();
    const ast = parse(code);
    const templates = [];
    simple(ast, {
        TaggedTemplateExpression(node, module, c) {
            // base.TaggedTemplateExpression(node, module, c);
            if(!isAzoth(node)) return;
            templates.push(node);
        },
    });
       
    return templates;
}
