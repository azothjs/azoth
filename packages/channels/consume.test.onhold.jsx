import { describe, test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { subject } from './generators.js';
import { consume } from './consume.js';
import { CatCount, CatList } from './test-cats.js';

beforeEach(fixtureSetup);

describe('promise', () => {

    test('promise single action', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();

        let received = '';
        consume(promise, cat => received = cat);
        resolve('felix');
        await promise;
        expect(received).toBe('felix');
    });

    test('promise actions', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();

        const received = [];
        consume(promise,
            name => received.push(`${name} 1`),
            name => received.push(`${name} 2`),
            name => received.push(`${name} 3`),
        );
        await resolve('felix');
        expect(received).toEqual([
            'felix 1',
            'felix 2',
            'felix 3',
        ]);
    });

});
