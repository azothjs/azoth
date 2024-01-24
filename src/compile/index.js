import { generate as astring } from 'astring';
import { AzothGenerator } from './AzothGenerator.js';

export function generate(ast, config) {
    const generator = new AzothGenerator();

    const code = astring(ast, {
        ...config,
        generator,
    });

    const templates = generator.templates.map(({ id, html }) => {
        return { id, html };
    });

    return { code, templates };
}
