import { test } from 'vitest';
import { subject } from './generators.js';
import './with-resolvers-polyfill.js';

test('subject', async ({ expect }) => {
    const [signal, iterator] = subject('/');

    let { value } = await iterator.next();
    expect(value).toBe('/');

    // listen for next call
    let iteratorPromise = iterator.next();
    // fire the event
    signal('/page');
    // check the response
    ({ value } = await iteratorPromise);
    // /page
    expect(value).toBe('/page');

    // set it back
    iteratorPromise = iterator.next();
    signal('/');
    ({ value } = await iteratorPromise);
    expect(value).toBe('/');
});

test('adaptor', async ({ expect }) => {
    const [signal, iterator] = subject(0, x => x ** x);

    expect((await iterator.next()).value).toBe(0);
    let iteratorPromise = iterator.next();
    signal(2);
    expect((await iteratorPromise).value).toBe(4);
});

class Multicast {
    consumers = [];
    constructor(subject) {
        this.subject = subject;
        this.#start();
    }

    async #start() {
        for await(let value of this.subject) {
            for(let consumer of this.consumers) {
                consumer(value);
            }
        }
    }

    subscriber() {
        const [signal, iterator] = subject();
        this.consumers.push(signal);
        return iterator;
    }
}

test('multicast', async ({ expect }) => {
    const [signal, iterator] = subject(0);

    const multicast = new Multicast(iterator);
    const s1 = multicast.subscriber();
    const s2 = multicast.subscriber();
    const s3 = multicast.subscriber();

    const toValues = iterations => iterations.map(({ value }) => value);

    function getNextPromises(list = [s1, s2, s3]) {
        return Promise.all(list.map(s => s.next()));
    }
    function getPromise(s) {
        return s => s.next();
    }


    let values = toValues(await getNextPromises());

    // eslint-disable-next-line no-sparse-arrays
    expect(values).toEqual([, , ,]);

    let promises = getNextPromises();
    signal(1);
    values = toValues(await promises);
    expect(values).toEqual([1, 1, 1,]);

    promises = getNextPromises([s1, s3]);
    signal(22);
    values = toValues(await promises);
    expect(values).toEqual([22, 22]);


    // signal(10);
    // const p1 = getPromise([s1])[0];
    // signal(20);
    // const p2 = getPromise([s2])[0];
    // signal(30);
    // const p3 = getPromise([s3])[0];
    // signal(40);

    // values = toValues(await Promise.all([p1, p2, p3]));
    // expect(values).toEqual([10, 10]);


});

