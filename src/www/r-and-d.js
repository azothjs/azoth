const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const b = sleep(3000).then(() => $`boo`);
const c = Promise.resolve('cat');

function f1() {

    let color = 'red';
    const getOpen = function *(){ while(true) yield open; };
    const log = b => console.log(`${b}: ${color}`);
    log('raw');
    b.then(log);
    return `
        ${sleep(300).then(() => (color = 'blue', log('set@300ms'))), 'initial load'}
    `;
}


console.log(f1());




// await in template
console.log(1);

const $ = async (strings, ...exprs) => String.raw(strings, ...exprs);

console.log(2);
export const template = `
    a ${console.log(3), 3} ${await c, await b} ${console.log(4), 4} c
`;
console.log(5);

document.body.append(template);