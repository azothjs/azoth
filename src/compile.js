import { generate, parse } from './utils/ast.js';
import { base, recursive } from 'acorn-walk';
import { InlineRenderer } from './transformers/template-renderers.js';
import { makeTemplateBody } from './transformers/template.js';
// import { SourceMapGenerator } from 'source-map';

export function compile(source) {
    const ast = parse(source);
    const module = new Module(ast);

    const isAzoth = node => node.tag?.name === module.templateTag;

    recursive(ast, module, {
        TaggedTemplateExpression(node, module, c) {
            base.TaggedTemplateExpression(node, module, c);
            if(!isAzoth(node)) return;
            module.makeTemplate(node);
        },
        
        Program(node, module, c) {
            module.pushBlock(node);
            c(node, module, 'BlockStatement');
            module.popBlock(node);
        },
        
        Function(node, module, c) {
            module.pushBlock(node);
            base.Function(node, module, c);
            module.popBlock(node);
        },

        ReturnStatement(node, module, c) {
            if(node.argument) {
                const arg = node.argument;
                if(arg.type === 'TaggedTemplateExpression' && isAzoth(arg)){
                    arg.returnStatement = node;
                }
            }
            base.ReturnStatement(node, module, c);
        },
    });

    module.write();
    return generate(ast);
}

class Module {
    templateTag = '_';
    ast = null;
    body = null;
    templates = [];
    renderer = new InlineRenderer();
    stack = [];
    generator = null;
    name = '';
    
    constructor(ast, { module = 'test' } = {}) {
        this.ast = ast;
        this.name = module;
        // this.generator = new SourceMapGenerator({
        //     file: module
        // });
    }

    makeTemplate(node) {        
        const html = node.quasi.quasis.map(q => q.value.raw).join('');
        const index = this.renderer.add(html);
        
        const parentFn = this.stack.at(-1);
        const statement = makeTemplateBody({ index });

        if(canBeImplicit(parentFn, node)){
            parentFn.body = statement;
        }
        else if(node.returnStatement){
            node.returnStatement.argument = statement;
        } 
        else {
            throw new Error('tagged template location not yet implemented');
        }
        
    }

    write() {
        const { declarations } = this.renderer;
        this.ast.body.push(...declarations);
        // console.log(this.generator.toString());
    }

    pushBlock(node) {
        this.stack.push(node);
    }

    popBlock(node) {
        const test = this.stack.pop();
        if(test !== node) throw new Error('unexpected module stack pop result');
    }

}

function canBeImplicit(parentFn, node) {
    if(parentFn.type !== 'ArrowFunctionExpression') return false;
    if(parentFn.body === node) return true; // already implicit return
    // Added in ReturnStatement node walker visitor:
    const { returnStatement } = node; 
    if(!returnStatement) return false;
    // only one statement in body which is the existing return statement
    const statements = parentFn?.body?.body;
    if(statements?.length !== 1) return false;
    return statements[0] === returnStatement; 
}
