import { generate, parse } from './utils/ast.js';
import { simple } from 'acorn-walk';
export function compile(source) {
    const ast = parse(source);

    const templates = [];
    simple(ast, {
        TaggedTemplateExpression(node, state, ancestors) {
            if(node.tag.name !== '_') return;

            const html = node.quasi.quasis.map(q => q.value.raw).join('');
            templates.push(html);
            console.log('quasi', node.quasi.quasis[0].value.raw);
            // console.log('state', state);
            // console.log('ancestors', ancestors);
        }
    });

    const vars = templates.map((t, i) => {
        return `\nvar __template${i} = __makeRenderer(\`${t}\`);`;
    });
    return generate(ast) + vars.join('');
}