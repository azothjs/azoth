import { elementWithAnchor, elementWithTextAnchor, elements } from 'test-utils/elements';
import { beforeEach, describe, test } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { findByText, findAllByText } from '@testing-library/dom';
import { runCompose } from './compose.test.js';


export function fixtureSetup(context) {
    document.body.innerHTML = '';
    context.fixture = document.body;
    context.find = (filter, options) => findByText(context.fixture, filter, options);
    context.findAll = (filter, options) => findAllByText(context.fixture, filter, options);
}

beforeEach(fixtureSetup);

describe('async values', () => {

    test('promise', async ({ expect, fixture, find }) => {
        const dom = runCompose(Promise.resolve('hi'), elementWithAnchor);
        fixture.append(dom);
        await find('hi');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            hi
            <!--1-->
          </div>
        `);
    });

    test('array of promises', async ({ expect, fixture, find }) => {
        const futureLetters = [
            Promise.resolve('a'),
            Promise.resolve('b'),
            Promise.resolve('c'),
        ];
        const dom = runCompose(futureLetters, elementWithAnchor);
        fixture.append(dom);
        await find('abc');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            a
            b
            c
            <!--3-->
          </div>
        `);
    });

    test('async iterator', async ({ expect, fixture, find }) => {
        let resolve = null;
        const doAsync = async (value) => {
            const { promise, resolve: res } = Promise.withResolvers();
            resolve = () => res(value);
            return promise;
        };

        async function* numbers() {
            yield doAsync('one');
            yield doAsync('two');
            yield doAsync('three');
        }

        fixture.append(runCompose(numbers(), elementWithAnchor));
        // initial render
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div><!--0--></div>"`
        );

        resolve();
        await find('one');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>one<!--1--></div>"`
        );

        resolve();
        await find('two');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>two<!--1--></div>"`
        );

        resolve();
        await find('three');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>three<!--1--></div>"`
        );

        resolve();
        await find('three');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>three<!--1--></div>"`
        );
    });

    test('generator function called', async ({ expect, fixture, find }) => {
        const { promise, resolve } = Promise.withResolvers();

        async function* generator() {
            yield promise;
        }

        const numbersDom = runCompose(generator, elementWithAnchor);
        fixture.append(numbersDom);
        resolve('yielded');
        await find('yielded');

        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<div>yielded<!--1--></div>"`
        );
    });
});
