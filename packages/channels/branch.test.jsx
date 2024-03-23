import { describe, test, beforeEach } from 'vitest';
import './with-resolvers-polyfill.js';
import { fixtureSetup } from 'test-utils/fixtures';
import { subject } from './generators.js';
import { branch } from './branch.js';
import { waitForElementToBeRemoved } from '@testing-library/dom';
import { Cat, CatCount, CatList, CatNames } from './test-cats.jsx';

beforeEach(fixtureSetup);

describe('branch: promise', () => {

    beforeEach(context => {
        context.childHTML = () => [
            ...context.fixture.childNodes
        ].map(cn => cn.outerHTML ?? cn);
    });

    test.only('...transforms', async ({ fixture, find, expect, childHTML }) => {
        const promise = Promise.resolve(['felix', 'duchess', 'stimpy']);
        const [Count, List] = branch(promise, CatCount, CatNames);
        fixture.append(<Count />, <List />);

        await Promise.all([find('felix'), find('3 cats')]);
        expect(childHTML())
            .toMatchInlineSnapshot(`
              [
                "<p>3<!--1--> cats</p>",
                <!--1-->,
                "<ul><li>felix<!--1--></li><li>duchess<!--1--></li><li>stimpy<!--1--></li><!--3--></ul>",
                <!--1-->,
              ]
            `);
    });

    test('all transform/option combos', async ({
        fixture, find, expect, childHTML
    }) => {
        const { promise, resolve } = Promise.withResolvers();

        const Channels = branch(
            promise,
            [null, { start: 'start-' }],
            [null, { init: 'init-' }],
            [name => 'second-', { start: 'first-' }],
            [name => name.toUpperCase(), { init: 'felix' }],
            null,
            name => `-${name}!`,
            [name => name[0]],
        );

        expect(Channels.length).toBe(7);
        fixture.append(<>{Channels.map(Channel => <p><Channel /></p>)}</>);
        expect(childHTML()).toMatchInlineSnapshot(`
          [
            "<p>start-<!--1--><!--1--></p>",
            "<p>init-<!--1--><!--1--></p>",
            "<p>first-<!--1--><!--1--></p>",
            "<p>FELIX<!--1--><!--1--></p>",
            "<p><!--0--><!--1--></p>",
            "<p><!--0--><!--1--></p>",
            "<p><!--0--><!--1--></p>",
            <!--7-->,
          ]
        `);

        resolve('cat-');

        await find('c');
        expect(childHTML()).toMatchInlineSnapshot(`
          [
            "<p>cat-<!--1--><!--1--></p>",
            "<p>cat-<!--1--><!--1--></p>",
            "<p>second-<!--1--><!--1--></p>",
            "<p>CAT-<!--1--><!--1--></p>",
            "<p>cat-<!--1--><!--1--></p>",
            "<p>-cat-!<!--1--><!--1--></p>",
            "<p>c<!--1--><!--1--></p>",
            <!--7-->,
          ]
        `);

    });
});

describe('branch: async iterator', () => {

    test.skip('branch ...channels', async ({ fixture, find, expect }) => {
        let cats = ['felix', 'duchess', 'stimpy'];
        const [catsChannel, dispatch] = subject(value => cats = value, {
            startWith: cats
        });

        const [CountChannel, ListChannel] = branch(catsChannel, CatCount);
        fixture.append(<CountChannel />, <ListChannel />);

        await Promise.all([find('felix'), find('3 cats')]);
        expect(fixture).toMatchInlineSnapshot(`
          <body>
            <p>
              3
              <!--1-->
               cats
            </p>
            <!--1-->
            <ul>
              <p>
                felix
                <!--1-->
              </p>
              <p>
                duchess
                <!--1-->
              </p>
              <p>
                stimpy
                <!--1-->
              </p>
              <!--3-->
            </ul>
            <!--1-->
          </body>
        `);

        dispatch(['garfield']);
        await Promise.all([find('garfield'), find('1 cats')]);
        expect(fixture).toMatchInlineSnapshot(`
          <body>
            <p>
              1
              <!--1-->
               cats
            </p>
            <!--1-->
            <ul>
              <p>
                garfield
                <!--1-->
              </p>
              <!--1-->
            </ul>
            <!--1-->
          </body>
        `);
    });

    test.skip('branch options', async ({ fixture, find, findAll, expect }) => {
        const [cats, dispatch] = subject();

        const [ListChannel, MapChannel, CountChannel] = branch(
            cats,
            [CatList, { startWith: <Loading /> }],
            [Cat, { map: true }],
            CatCount
        );
        fixture.append(<ListChannel />, <MapChannel />, <CountChannel />);
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<!--0--><!--0--><!--0-->"`
        );

        await find('loading...');
        expect(fixture.innerHTML).toMatchInlineSnapshot(
            `"<p>loading...</p><!--1--><!--0--><!--0-->"`
        );

        dispatch([
            { name: 'felix' },
            { name: 'duchess' },
            { name: 'garfield' }
        ]);

        await findAll('felix');
        expect(fixture).toMatchInlineSnapshot(
            `
          <body>
            <ul>
              <p>
                felix
                <!--1-->
              </p>
              <p>
                duchess
                <!--1-->
              </p>
              <p>
                garfield
                <!--1-->
              </p>
              <!--3-->
            </ul>
            <!--1-->
            <p>
              felix
              <!--1-->
            </p>
            <p>
              duchess
              <!--1-->
            </p>
            <p>
              garfield
              <!--1-->
            </p>
            <!--3-->
            <p>
              3
              <!--1-->
               cats
            </p>
            <!--1-->
          </body>
        `
        );

        dispatch([]);
        await waitForElementToBeRemoved(fixture.firstChild);

        expect(fixture).toMatchInlineSnapshot(
            `
          <body>
            <ul>
              <!--0-->
            </ul>
            <!--1-->
            <!--0-->
            <p>
              0
              <!--1-->
               cats
            </p>
            <!--1-->
          </body>
        `
        );

        dispatch([{ name: 'stimpy' }]);
        await findAll('stimpy');
        expect(fixture).toMatchInlineSnapshot(`
          <body>
            <ul>
              <p>
                stimpy
                <!--1-->
              </p>
              <!--1-->
            </ul>
            <!--1-->
            <p>
              stimpy
              <!--1-->
            </p>
            <!--1-->
            <p>
              1
              <!--1-->
               cats
            </p>
            <!--1-->
          </body>
        `);
    });

});