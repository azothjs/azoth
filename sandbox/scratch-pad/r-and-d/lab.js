/* eslint-disable no-console */
import { __makeRenderer } from '../azoth/index.js';

const sleep = ms => {
    const controller = new AbortController();
    const signal = controller.signal;
    const { promise, resolve, reject } = Promise.withResolvers();
    const timeout = setTimeout(resolve, ms);
    signal.onabort = () => {
        clearTimeout(timeout);
        reject('cancelled');
    };

    return { promise, controller };
};

async function* getOperator(operator) {
    let handler = yield;
    yield* operator(handler);
}

async function* operator(handler) {
    let count = 0;
    let request = yield await { handler, text: 'enter search to get started loading...' };
    console.log('request received', count++, request, null);
    while(true) {
        let { promise, controller } = sleep(1000);
        yield controller;

        try {
            const response = await promise;
            console.log('request over');
            request = yield await { handler, text: `<${request} rabbits>` };
        }
        catch(err) {
            if(err === 'cancelled') {
                console.log('request cancelled');
            }
            request = yield;
        }

        console.log('request received', count++, request);
    }
}

const it = getOperator(operator);
await it.next();
const handler = async query => (await it.next(query))?.value;
const { value: v1 } = await it.next(handler);
// console.log(v1);

export async function searchHandler(e) {
    e.preventDefault();
    const query = new FormData(this).get('query');
    const value = await handler(query);
    // console.log(value);
}

async function testAsync() {
    const operatorIt = operator(null);
    const { value: v1 } = await operatorIt.next();
    console.log(v1.text);

    console.log('sending first request');
    let { value: controller } = await operatorIt.next('input 1');
    const p1 = operatorIt.next();

    console.log('sending second request');
    controller.abort();
    let { value: c2 } = await operatorIt.next('input 2');
    const p2 = operatorIt.next();
    const { value: v2 } = await p2;
    console.log(v2.text);

    await sleep(2500).promise;
    const result = await p1;
    console.log(result);
}

testAsync();

