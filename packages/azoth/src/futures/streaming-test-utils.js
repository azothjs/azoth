
export class NodeStreamToReadableStream extends ReadableStream {
    constructor(stream) {
        super({
            start(controller) {
                stream.on('data', chunk => {
                    controller.enqueue(chunk);
                });
                stream.on('end', () => {
                    controller.close();
                });
            }
        });
    }
}

export class TestWriter {
    #chunks = [];
    #resolve = null;
    constructor() {
        const { promise, resolve } = Promise.withResolvers();
        this.promise = promise;
        this.#resolve = resolve;
    }
    write(chunk) {
        this.#chunks.push(chunk);
    }
    close() {
        this.#resolve(this.#chunks);
    }
}

export class TestWritableStream extends WritableStream {
    constructor() {
        const writer = new TestWriter();
        super(writer);
        this.promise = writer.promise;
        this.chunks = writer.chunks;
    }
}
