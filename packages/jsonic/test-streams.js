import 'test-utils/with-resolvers-polyfill';
import { createReadStream } from 'node:fs';

export class ReadJSONFile extends ReadableStream {
    constructor(jsonPath) {
        const nodeStream = createReadStream(jsonPath);
        super({
            start(controller) {
                nodeStream.on('data', chunk => {
                    controller.enqueue(chunk);
                });
                nodeStream.on('end', () => {
                    controller.close();
                });
            }
        });
    }
}

export class ReadStringStream extends ReadableStream {
    constructor(text) {
        super({
            start(controller) {
                controller.enqueue(text);
                controller.close();
            }
        });
    }
}

export class TestWriteStream extends WritableStream {
    static withResolver() {
        const writeStream = new TestWriteStream();
        return [writeStream, writeStream.promise];
    }

    constructor() {
        const writer = new TestWriter();
        super(writer);
        this.promise = writer.promise;
        this.chunks = writer.chunks;
    }
}

class TestWriter {
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
