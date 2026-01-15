import { describe, test, beforeEach } from 'vitest';
import { fixtureSetup } from 'test-utils/fixtures';

beforeEach(fixtureSetup);

describe('rerender', () => {

    test('function new.target', ({ expect }) => {
        const A = { true: '' }; const B = { false: '' };

        function Fn() {
            return new.target ? A : B;
        }

        expect(new Fn()).toBe(A);
        expect(Fn()).toBe(B);

        function Wrap() {
            return () => new.target ? A : B;
        }

        // not terribly useful for arrows...
        const fn = new Wrap();
        expect(fn()).toBe(A);
        expect(fn()).toBe(A);

        const fn2 = Wrap();
        expect(fn2()).toBe(B);
        expect(fn2()).toBe(B);

    });

    test('basic update', ({ expect }) => {

    });

});