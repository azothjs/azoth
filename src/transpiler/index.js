import { generate as astring } from 'astring';
import { TemplateGenerator } from './TemplateGenerator.js';

export function generate(ast, config) {
    const generator = new TemplateGenerator();

    const code = astring(ast, {
        ...config,
        generator,
    });

    const templates = generator.templates.map(({ id, html }) => {
        return { id, html };
    });

    return { code, templates };
}
