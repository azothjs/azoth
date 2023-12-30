import { __makeRenderer } from '../azoth/index.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


async function * operator() {
    let request = yield await { text: 'enter search to get started loading...' };
    while(true) {
        sleep(2000);
        request = yield await { text: `<${request} rabbits>` };
    }
}

// console.log('1 start');
const it = operator('option');
// async generator, so ring ring ring ...
const { value: v1 } = await it.next();
console.log(v1);
// const handler = (v) => it.next(v);
// const { value: v2 } = await it.next({ handler, initRequest: true });
// console.log(v2);

export async function searchHandler(e) {
    e.preventDefault();
    const query = new FormData(this).get('query');
    const { value } = await it.next(query);
    console.log(value);
}


