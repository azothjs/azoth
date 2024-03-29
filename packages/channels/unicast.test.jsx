import './with-resolvers-polyfill.js';
import { beforeEach, test } from 'vitest';
import { fixtureSetup } from 'test-utils/fixtures';
import { unicast } from './unicast.js';

// TODO: move away from fixture

beforeEach(fixtureSetup);

test('unicast()', async ({ fixture, find, expect }) => {
    const [asyncIterator, next] = unicast();
    fixture.append(<>{asyncIterator}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);
    next('test');
    await find('test');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"test<!--1-->"`);

});

test('transform', async ({ fixture, find, expect }) => {
    const [asyncIterator, next] = unicast(s => s?.toUpperCase());
    fixture.append(<>{asyncIterator}</>);

    next('hello');
    await find('HELLO');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"HELLO<!--1-->"`);
    next();
    await find('');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);
});

test('transform, init', async ({ fixture, find, expect }) => {
    const [wrappedAsync, next] = unicast(x => x ** 2, 2);
    fixture.append(<>{wrappedAsync}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"4<!--1-->"`);
    next(3);
    await find('9');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"9<!--1-->"`);
});

test('null, init', async ({ fixture, find, expect }) => {
    const [wrappedAsync, next] = unicast(2);
    fixture.append(<>{wrappedAsync}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"2<!--1-->"`);
    next(3);
    await find('3');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"3<!--1-->"`);
});

test('throw if transform not function', ({ expect }) => {
    expect(() => {
        unicast(2, 2);
    }).toThrowErrorMatchingInlineSnapshot(`
      [TypeError: The "transform" argument must be a function. If you want to use an initial value with no function, pass "null" as the first argument to "unicast". Received:

      2

      ]
    `);
});
