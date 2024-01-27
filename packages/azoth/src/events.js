

// in-source test suites
if(import.meta.vitest) {

    const { test } = import.meta.vitest
    test('add', ({ expect }) => {
        let called = false;
        const listener = () => { called = true; };


    })
}