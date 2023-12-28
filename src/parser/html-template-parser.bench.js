import { beforeEach, describe, test, bench } from 'vitest';
import { getParser } from './html-template-parser.js';
import { addSerializers } from './serializers.js';
 
bench('parse template attributes', () => {
    const parser = getParser();
    parser.write(`<input class=`);
    parser.write(` required name="`);
    parser.write(`" maxLength='`);
    parser.write(`' type='text' disabled=`);
    const { html, bindings } = parser.end(`></p>`);
});