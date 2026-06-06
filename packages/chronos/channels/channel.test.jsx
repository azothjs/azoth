import { describe, test, beforeEach } from 'vitest';
import '../with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { unicast } from '../generators/unicast.js';
import { channel } from '@azothjs/maya/channels';
import { sleep } from '../../../test-utils/sleep.js';
import { Cat } from '../test-utils.jsx';

beforeEach(fixtureSetup);

describe('promise', () => {

    test('promise only', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve('felix');
        const CatChannel = channel(promise);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);

        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"felix<!--1-->"`);
    });

    test('transform', async ({ fixture, find, expect }) => {
        const promise = Promise.resolve({ name: 'felix' });
        const CatChannel = channel(promise, Cat);
        fixture.append(<CatChannel />);

        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);
    });

    test('transform, { initial }', async ({ fixture, find, expect }) => {
        const promise = sleep(50).then(() => 'duchess');

        const CatChannel = channel(promise, name => <p>{name}</p>, {
            initial: 'loading…'
        });

        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"loading…<!--1-->"`);

        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>duchess<!--1--></p><!--1-->"`
        );
    });
});

describe('async iterator', () => {

    test('iterator only', async ({ fixture, find, expect }) => {
        const [iterator, next] = unicast();

        const CatChannel = channel(iterator);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);

        next(<Cat name='felix' />);
        await find('felix');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);

        next(<Cat name='duchess' />);
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);
    });

    test('transform', async ({ fixture, find, expect }) => {
        const [cat, next] = unicast();

        const CatChannel = channel(cat, Cat);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<!--0-->"`);

        next({ name: 'duchess' });
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);

        next({ name: 'garfield' });
        await find('garfield');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>garfield<!--1--></p><!--1-->"`);
    });

    test('{ initial }', async ({ fixture, find, expect }) => {
        const [cat, next] = unicast();

        const CatChannel = channel(cat, { initial: 'felix' });
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"felix<!--1-->"`);

        next('duchess');
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"duchess<!--1-->"`);
    });
});

describe('Channel-wrapped source', () => {

    test('sync from wrapped source', async ({ fixture, find, expect }) => {
        // unicast('felix') wraps the iterator in a Channel with 'felix' as initial
        const [cat, next] = unicast('felix');

        const CatChannel = channel(cat);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"felix<!--1-->"`);

        next('duchess');
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"duchess<!--1-->"`);
    });

    test('sync with transform from wrapped source', async ({ fixture, find, expect }) => {
        const [cat, next] = unicast({ name: 'felix' });

        const CatChannel = channel(cat, Cat);
        fixture.append(<CatChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>felix<!--1--></p><!--1-->"`);

        next({ name: 'duchess' });
        await find('duchess');
        expect(fixture.innerHTML).toMatchInlineSnapshot(`"<p>duchess<!--1--></p><!--1-->"`);
    });
});

describe('throws', () => {
    test('combining wrapped source with { initial }', ({ expect }) => {
        const [cat] = unicast('felix');
        expect(() => {
            channel(cat, { initial: 'duchess' });
        }).toThrowErrorMatchingInlineSnapshot(
            `[TypeError: Channel: childNodes cannot be combined with a Channel-wrapped source]`
        );
    });

    test('unsupported source type', ({ expect }) => {
        expect(() => {
            channel({ not: 'a source' });
        }).toThrowErrorMatchingInlineSnapshot(
            `[TypeError: Channel: unsupported source type "object". Expected Promise, async iterable, or Channel-wrapped value.]`
        );
    });
});
