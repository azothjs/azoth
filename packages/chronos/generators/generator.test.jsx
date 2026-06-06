import { beforeEach, test } from 'vitest';
import '../with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { generator } from './generator.js';

beforeEach(fixtureSetup);

test('generator()', async ({ fixture, find, expect }) => {
    const [asyncIterator, next] = generator();
    fixture.append(<>{asyncIterator}</>);
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);
    next('test');
    await find('test');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"test<!--1-->"`);
});

test('transform', async ({ fixture, find, expect }) => {
    const [asyncIterator, next] = generator(s => s?.toUpperCase());
    fixture.append(<>{asyncIterator}</>);

    next('hello');
    await find('HELLO');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"HELLO<!--1-->"`);
    next();
    await find('');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);
});

test('dispatches queued before consumption yield in order', async ({ fixture, find, expect }) => {
    const [iter, next] = generator();
    next('first');
    next('second');
    // Consumer starts here — both queued values yield in order.
    fixture.append(<>{iter}</>);
    await find('second');
    expect(fixture.innerHTML).toMatchInlineSnapshot(`"second<!--1-->"`);
});

// Removed: options.start, options.init, both-start-and-init, options.error.
// generator() no longer accepts options — those concepts moved to
// maya's Channel (initial via childNodes; error transform via the error
// prop). See packages/chronos/CLEANUP.md.
