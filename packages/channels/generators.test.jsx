import { beforeEach, test } from 'vitest';
import { subject } from './generators.js';
import { screen } from '@testing-library/dom';

beforeEach(async context => {
    document.body.innerHTML = '';
    context.fixture = document.body;
});

test.skip('subject', async ({ fixture, expect }) => {

    const [asyncIterator, dispatch] = subject();
    const dom = <div>{asyncIterator}!</div>;
    fixture.append(dom);

    await screen.findByText('!', { exact: false });

    expect(dom).toMatchInlineSnapshot(`
      <div>
        <!--0-->
        !
      </div>
    `);

    dispatch('Hello World');
    await screen.findByText('Hello World', { exact: false });

    expect(dom).toMatchInlineSnapshot(`
      <div>
        Hello World
        <!--1-->
        !
      </div>
    `);
});

// test.skip('multicast', async ({ expect }) => {
//     const [asyncIterator, dispatch] = subject({ startWith: 'hello' });

//     const mc = multicast(asyncIterator);
//     const s1 = mc.subscriber();
//     const s2 = mc.subscriber();
//     const s3 = mc.subscriber();
//     const dom = [
//         runCompose(s1, elementWithAnchor),
//         runCompose(s2, elementWithAnchor),
//         runCompose(s3, elementWithAnchor),
//     ];
//     dispatch('wat');

//     await null;
//     await null;
//     await null;



//     // function getNextPromises(list = [s1, s2, s3]) {
//     //     return Promise.all(list.map(s => s.next()));
//     // }
//     // function getPromise(s) {
//     //     return s => s.next();
//     // }


//     // let values = toValues(await getNextPromises());

//     // // eslint-disable-next-line no-sparse-arrays
//     // expect(values).toEqual([, , ,]);

//     // let promises = getNextPromises();
//     // dispatch(1);
//     // values = toValues(await promises);
//     // expect(values).toEqual([1, 1, 1,]);

//     // promises = getNextPromises([s1, s3]);
//     // dispatch(22);
//     // values = toValues(await promises);
//     // expect(values).toEqual([22, 22]);


//     // dispatch(10);
//     // const p1 = getPromise([s1])[0];
//     // dispatch(20);
//     // const p2 = getPromise([s2])[0];
//     // dispatch(30);
//     // const p3 = getPromise([s3])[0];
//     // dispatch(40);

//     // values = toValues(await Promise.all([p1, p2, p3]));
//     // expect(values).toEqual([10, 10]);


// });

