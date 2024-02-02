import { test } from 'vitest';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import '../test-utils/with-resolvers-polyfill.js';


const jsonPath = resolve(__dirname, './emoji-3.json');
const nodeStream = createReadStream(jsonPath);
const emojiStream = nodeStreamToReadableStream(nodeStream);

function nodeStreamToReadableStream(stream) {
    return new ReadableStream({
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

function getWriter() {
    let result = [];
    const { promise, resolve } = Promise.withResolvers();
    const writable = new WritableStream({
        write(chunk) {
            result.push(chunk);
        },
        close() {
            resolve(result);
        },
    });

    return [writable, promise];
}

const jsonParse = new TransformStream({
    transform(chunk, controller) {
        controller.enqueue(JSON.parse(chunk));
    }
});

test.only('streams a json file', async ({ expect }) => {

    const stack = [];
    let context = '';
    let buffer = '';
    const transform = new TransformStream({
        start() { },
        transform(chunk, controller) {
            for(let i = 0; i < chunk.length; i++) {
                switch(context) {
                    case 'END':
                        // TODO: can we make this stream stop?
                        // process another array? :shrug:
                        continue;
                    case '': {
                        // found the array
                        if(chunk[i] === '[') {
                            stack.push(context);
                            context = '$';
                        }
                        continue;
                    }
                    case '$': // target array root
                        // target object in array
                        if(chunk[i] === '{') {
                            buffer += chunk[i];
                            stack.push(context);
                            context = '${';
                        }
                        // end of array
                        if(chunk[i] === ']') {
                            context = stack.pop();
                        }
                        // malformed JSON
                        if(chunk[i] === '}') {
                            throw new Error(`Unexpected JSON token "}" at ${i} of ${chunk}`);
                        }

                        continue;

                    case '${': {
                        // object complete
                        if(chunk[i] === '}') {
                            buffer += chunk[i];
                            context = stack.pop();
                            controller.enqueue(buffer);
                            buffer = '';
                            continue;
                        }
                        // sub-object
                        if(chunk[i] === '{') {
                            stack.push(context);
                            context = '{';
                        }
                        // sub-array
                        if(chunk[i] === '[') {
                            stack.push(context);
                            context = '[';
                        }
                        // malformed JSON
                        if(chunk[i] === ']') {
                            throw new Error(`Unexpected JSON token "]" at ${i} of ${chunk}`);
                        }

                        buffer += chunk[i];
                        continue;
                    }
                    case '{': {
                        // end sub-object
                        if(chunk[i] === '}') {
                            context = stack.pop();
                        }
                        // sub-object
                        if(chunk[i] === '{') {
                            stack.push(context);
                            context = '{';
                        }
                        // sub-array
                        if(chunk[i] === '[') {
                            stack.push(context);
                            context = '[';
                        }
                        // malformed JSON
                        if(chunk[i] === ']') {
                            throw new Error(`Unexpected JSON token "]" at ${i} of ${chunk}`);
                        }
                        continue;
                    }
                    case '[': {
                        // end sub-array
                        if(chunk[i] === ']') {
                            context = stack.pop();
                        }
                        // sub-object
                        if(chunk[i] === '{') {
                            stack.push(context);
                            context = '{';
                        }
                        // sub-array
                        if(chunk[i] === '[') {
                            stack.push(context);
                            context = '[';
                        }
                        // malformed JSON
                        if(chunk[i] === '}') {
                            throw new Error(`Unexpected JSON token "]" at ${i} of ${chunk}`);
                        }

                        buffer += chunk[i];

                    }

                }

            }
        },
        flush() { },
    });



    const [writable, written] = getWriter();
    emojiStream
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(transform)
        .pipeThrough(jsonParse)
        .pipeTo(writable);

    return written.then(result => {
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "category": "smileys and people",
              "group": "face positive",
              "htmlCode": [
                "&#128512;",
              ],
              "name": "grinning face",
              "unicode": [
                "U+1F600",
              ],
            },
            {
              "category": "smileys and people",
              "group": "face positive",
              "htmlCode": [
                "&#128513;",
              ],
              "name": "grinning face with smiling eyes",
              "unicode": [
                "U+1F601",
              ],
            },
            {
              "category": "smileys and people",
              "group": "face positive",
              "htmlCode": [
                "&#128514;",
              ],
              "name": "face with tears of joy",
              "unicode": [
                "U+1F602",
              ],
            },
          ]
        `);
    });
});

test.todo('errors and cancels');
