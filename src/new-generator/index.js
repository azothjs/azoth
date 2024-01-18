import { generate as astring } from 'astring';
import { AzothGenerator, HtmlGenerator } from './generators.js';

export function generate(ast, config) {
    const { code, templates } = generateJs(ast, config);
    const html = templates.map(t => generateHtml(t, config));
    return { code, html };
}

export function generateJs(ast, config) {
    const generator = new AzothGenerator();

    const code = astring(ast, {
        ...config,
        generator,
    });

    return { code, templates: generator.templates };
}

export function generateHtml(template, config) {
    const generator = new HtmlGenerator();

    return astring(template.node, {
        ...config,
        generator,
    });
}
