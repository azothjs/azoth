import { test } from 'vitest';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import '../test-utils/with-resolvers-polyfill.js';
import { JSONParseTransformStream } from './streaming-json-data-parser.js';
import { NodeStreamToReadableStream, TestWritableStream } from './streaming-test-utils.js';

const jsonParse = new TransformStream({
    transform(chunk, controller) {
        controller.enqueue(JSON.parse(chunk));
    }
});

test('streams a json file', async ({ expect }) => {

    const jsonPath = resolve(__dirname, './emoji-3.json');
    const nodeStream = createReadStream(jsonPath);
    const testWriter = new TestWritableStream();

    new NodeStreamToReadableStream(nodeStream)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new JSONParseTransformStream())
        .pipeThrough(jsonParse)
        .pipeTo(testWriter);

    return testWriter.promise.then(result => {
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
