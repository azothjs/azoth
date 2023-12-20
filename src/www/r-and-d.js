
class Target {
    textContent = '';
}

class Test {
    // target = null;

    constructor() {
        // this.target = document.createElement('p');
        this.target = new Target();
    }

    set b1(value) {
        this.target.textContent = value;
    }

    update(value) {
        this.target.textContent = value;
    }
}

const RUNS = 10;

for(let i = 0; i < RUNS; i++) {
    console.log('run', i + 1);

    const TIMES = 1_000_000;

    console.time('setter');
    const testProperty = new Test();
    for(let i = 0; i < TIMES; i++) {
        testProperty.b1 = `Hello ${i}`;
    }
    console.timeEnd('setter');

    console.time('method');
    const testMethod = new Test();
    for(let i = 0; i < TIMES; i++) {
        testMethod.update(`Hello ${i}`);
    }
    console.timeEnd('method');


    console.time('prop');
    const testProp = new Test();
    for(let i = 0; i < TIMES; i++) {
        testProperty.target.textContent = `Hello ${i}`;
    }
    console.timeEnd('prop');

    console.time('direct');
    // const target = document.createElement('p');
    const target = new Target();
    for(let i = 0; i < TIMES; i++) {
        target.textContent = `Hello ${i}`;
    }
    console.timeEnd('direct');
}