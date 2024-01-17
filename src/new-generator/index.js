import { generate } from 'astring';
import { AzothGenerator } from './AzothGenerator.js';

export function azothGenerate(ast, config) {
    const transpiler = new AzothGenerator();

    const code = generate(ast, {
        ...config,
        generator: transpiler,
    });

    return { code, stack: transpiler.stack };
}
