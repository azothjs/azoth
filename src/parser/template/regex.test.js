import { beforeEach, describe, test } from 'vitest';
import { 
    DEV_TRIM, 
    DEV_TRIM_END, 
    DEV_TRIM_START 
} from './regex.js';

describe.concurrent('DEV_TRIM_START', () => {
    Object.entries({
        '\nHello':         'new line',
        '    \nHello':     'spaces and new line',
        '\n    Hello':     'new line and trailing spaces',
        '    \n    Hello': 'spaces, new line, and spaces'
    }).forEach(([text, name]) => {

        test(name, ({ expect }) => {
            const trimmed = text.replace(DEV_TRIM_START, '');
            expect(trimmed).toBe('Hello');
        });

    });
});

describe.concurrent('DEV_TRIM_END', () => {
    Object.entries({
        'Hello\n':         'new line',
        'Hello    \n':     'spaces and new line',
        'Hello\n    ':     'new line and trailing spaces',
        'Hello    \n    ': 'spaces, new line, and spaces'
    }).forEach(([text, name]) => {

        test(name, ({ expect }) => {
            const trimmed = text.replace(DEV_TRIM_END, '');
            expect(trimmed).toBe('Hello');
        });

    });
});

describe.concurrent('DEV_TRIM (both)', () => {
    test('spaces, new line, and spaces', ({ expect }) => {
        const text = '    \n    Hello    \n    ';
        const trimmed = text.replace(DEV_TRIM, '');
        expect(trimmed).toBe('Hello');
    });
});

describe.concurrent('Not trimmed without newline', () => {
    test('leading spaces', ({ expect }) => {
        const trimmed = '    Hello'.replace(DEV_TRIM_START, '');
        expect(trimmed).toBe('    Hello');
    });

    test('trailing spaces', ({ expect }) => {
        const trimmed = 'Hello    '.replace(DEV_TRIM_END, '');
        expect(trimmed).toBe('Hello    ');
    });

    test('leading and trailing spaces', ({ expect }) => {
        const trimmed = '    Hello    '.replace(DEV_TRIM, '');
        expect(trimmed).toBe('    Hello    ');
    });
});
