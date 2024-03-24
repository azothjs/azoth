import { describe, test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { consume } from './consume.js';
import { unicast } from './unicast.js';

beforeEach(fixtureSetup);

describe('promise', () => {

    test('action', async ({ expect }) => {
        const { promise, resolve } = Promise.withResolvers();
        let received = '';
        consume(promise, cat => received = cat);
        resolve('felix');
        await promise;
        expect(received).toBe('felix');
    });

    test.skip('...actions', async ({ expect }) => {
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

describe('async iterator', () => {

    test('action', async ({ expect }) => {
        const [iter, next] = unicast();
        let { promise, resolve } = Promise.withResolvers();
        let test = { cat: '' };
        consume(iter, cat => {
            test.cat = cat;
            resolve();
        });
        expect(test.cat).toBe('');

        next('felix');
        await promise;
        expect(test.cat).toBe('felix');

        ({ promise, resolve } = Promise.withResolvers());
        next('duchess');
        await promise;
        expect(test.cat).toBe('duchess');

    });

    test('sync async', async ({ expect }) => {
        const [iter, next] = unicast('felix');
        let { promise, resolve } = Promise.withResolvers();
        let test = { cat: '' };
        consume(iter, cat => {
            test.cat = cat;
            resolve();
        });
        expect(test.cat).toBe('felix');

        ({ promise, resolve } = Promise.withResolvers());
        next('next');
        await promise;
        expect(test.cat).toBe('next');
    });

});
