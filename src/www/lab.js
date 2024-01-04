import { __makeRenderer } from '../azoth/index.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function * getOperator(operator) {
    let handler = yield;
    yield* operator(handler);
}

async function * operator(handler) {
    let request = yield await { handler, text: 'enter search to get started loading...' };
    while(true) {
        sleep(2000);
        request = yield await { handler, text: `<${request} rabbits>` };
    }
}

const it = getOperator(operator);
await it.next();
const handler = async query => (await it.next(query))?.value;
const { value: v1 } = await it.next(handler);
console.log(v1);

export async function searchHandler(e) {
    e.preventDefault();
    const query = new FormData(this).get('query');
    const value = await handler(query);
    console.log(value);
}


