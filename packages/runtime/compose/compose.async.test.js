import { elementWithAnchor, elementWithTextAnchor, elements } from 'test-utils/elements';
import { beforeEach, describe, test } from 'vitest';
import 'test-utils/with-resolvers-polyfill';
import { screen } from '@testing-library/dom';
import { runCompose } from './compose.test.js';

beforeEach(context => {
    document.body.innerHTML = '';
    context.fixture = document.body;
});

describe('async values', () => {

    test('promise', async ({ expect, fixture }) => {
        const dom = runCompose(Promise.resolve('hi'), elementWithAnchor);
        fixture.append(dom);
        await screen.findByText('hi');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            hi
            <!--1-->
          </div>
        `);
    });

    test('array of promises', async ({ expect, fixture }) => {
        const futureLetters = [
            Promise.resolve('a'),
            Promise.resolve('b'),
            Promise.resolve('c'),
        ];
        const dom = runCompose(futureLetters, elementWithAnchor);
        fixture.append(dom);
        await screen.findByText('abc');
        expect(dom).toMatchInlineSnapshot(`
          <div>
            a
            b
            c
            <!--3-->
          </div>
        `);
    });

    test('async generator', async ({ expect, fixture }) => {
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

        const numbersDom = runCompose(numbers(), elementWithAnchor);
        fixture.append(numbersDom);
        // initial render
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            <!--0-->
          </div>
        `);

        resolve();
        await screen.findByText('one');
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            one
            <!--1-->
          </div>
        `);

        resolve();
        await screen.findByText('two');
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            two
            <!--1-->
          </div>
        `);

        resolve();
        await screen.findByText('three');
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            three
            <!--1-->
          </div>
        `);

        resolve();
        await screen.findByText('three');
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            three
            <!--1-->
          </div>
        `);
    });

    test('generator called', async ({ expect, fixture }) => {
        const { promise, resolve } = Promise.withResolvers();

        async function* generator() {
            yield promise;
        }

        const numbersDom = runCompose(generator, elementWithAnchor);
        fixture.append(numbersDom);
        resolve('yielded');
        await screen.findByText('yielded');
        expect(numbersDom).toMatchInlineSnapshot(`
          <div>
            yielded
            <!--1-->
          </div>
        `);


    });
});
