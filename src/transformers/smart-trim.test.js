import { describe, expect, test } from 'vitest';
import '../utils/code-matchers';
import smartTrim from './smart-trim';

describe('removes leading', () => {
    test('new line', () => {
        const trimmed = smartTrim('\nHello');
        expect(trimmed).toBe('Hello');
    });
    
    test('spaces and new line', () => {
        const trimmed = smartTrim('    \nHello');
        expect(trimmed).toBe('Hello');
    });
    
    test('new line and trailing spaces', () => {
        const trimmed = smartTrim('\n    Hello');
        expect(trimmed).toBe('Hello');
    });
    
    test('spaces, new line, and spaces', () => {
        const trimmed = smartTrim('    \n    Hello');
        expect(trimmed).toBe('Hello');
    });
});

describe('removes trailing', () => {
    test('new line', () => {
        const trimmed = smartTrim('Hello\n');
        expect(trimmed).toBe('Hello');
    });
    
    test('spaces and new line', () => {
        const trimmed = smartTrim('Hello    \n');
        expect(trimmed).toBe('Hello');
    });
    
    test('new line and trailing spaces', () => {
        const trimmed = smartTrim('Hello\n    ');
        expect(trimmed).toBe('Hello');
    });
    
    test('spaces, new line, and spaces', () => {
        const trimmed = smartTrim('Hello    \n    ');
        expect(trimmed).toBe('Hello');
    });
});

describe('leading and trailing', () => {
    test('spaces, new line, and spaces', () => {
        const trimmed = smartTrim('    \n    Hello    \n    ');
        expect(trimmed).toBe('Hello');
    });
});

describe('does not remove without newline', () => {
    test('leading spaces', () => {
        const trimmed = smartTrim('    Hello');
        expect(trimmed).toBe('    Hello');
    });

    test('trailing spaces', () => {
        const trimmed = smartTrim('Hello    ');
        expect(trimmed).toBe('Hello    ');
    });

    test('leading and trailing spaces', () => {
        const trimmed = smartTrim('    Hello    ');
        expect(trimmed).toBe('    Hello    ');
    });
});
