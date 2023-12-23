const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// const cats = ['felix', 'duchess', 'tom'];

function * cats() {
    yield 'felix';
    yield 'duchess';
    yield 'tom';
}
const catsIterator = cats();
// catsIterator[Symbol.iterator]

const template = `hello ${[...catsIterator]}`;
console.log(template);

async function * effect() {
    yield 'loading...';
    sleep(5000);
    yield 'duchess';
}

// function * formatGreeting()

const effectIterator = effect();
// effectIterator[Symbol.asyncIterator])

for await (const cat of effect()) {
    console.log(cat);
}

