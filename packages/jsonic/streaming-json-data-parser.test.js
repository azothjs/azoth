import { test } from 'vitest';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import '../test-utils/with-resolvers-polyfill.js';
import { JSONParseTransformStream } from './streaming-json-data-parser.js';
import { NodeStreamToReadableStream, StringToReadableStream, TestWritableStream } from './streaming-test-utils.js';

test('streams a json file from root', async ({ expect }) => {

    const jsonPath = resolve(import.meta.dirname, './emoji-3.json');
    const nodeStream = createReadStream(jsonPath);
    const testWriter = new TestWritableStream();

    new NodeStreamToReadableStream(nodeStream)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new JSONParseTransformStream())
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

test('batch size groups objects in arrays of size', async ({ expect }) => {

    const jsonPath = resolve(import.meta.dirname, './emoji-3.json');
    const nodeStream = createReadStream(jsonPath);
    const testWriter = new TestWritableStream();

    new NodeStreamToReadableStream(nodeStream)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new JSONParseTransformStream({ batchSize: 2 }))
        .pipeTo(testWriter);

    return testWriter.promise.then(result => {
        expect(result).toMatchInlineSnapshot(`
          [
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
            ],
            [
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
            ],
          ]
        `);
    });
});

test('ignores context tokens in strings', async ({ expect }) => {

    const testWriter = new TestWritableStream();

    const testJSON = `[
        { "name": "fool}\\"yo[u" }
    ]`;

    new StringToReadableStream(testJSON)
        .pipeThrough(new JSONParseTransformStream())
        .pipeTo(testWriter);

    return testWriter.promise.then(result => {
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "name": "fool}"yo[u",
            },
          ]
        `);
    });
});

