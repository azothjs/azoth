import { generate as astring } from 'astring';
import { AzothGenerator } from './generators.js';

export function generate(ast, config) {
    const generator = new AzothGenerator();

    const code = astring(ast, {
        ...config,
        generator,
    });

    return { code, templates: generator.templates };
}
