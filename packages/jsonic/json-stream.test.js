import { beforeEach, test } from 'vitest';
import { resolve } from 'node:path';
import JSONStream from './json-stream.js';
import { ReadJSONFile, ReadStringStream, TestWriteStream } from './test-streams.js';

const EMOJIS = resolve(import.meta.dirname, './emoji-3.json');

beforeEach(context => {
    const [writeStream, wrote] = TestWriteStream.withResolver();
    context.writeStream = writeStream;
    context.wrote = wrote;
});

test('streams json file with array at root', async ({ expect, writeStream, wrote }) => {

    new ReadJSONFile(EMOJIS)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new JSONStream())
        .pipeTo(writeStream);

    expect(await wrote).toMatchInlineSnapshot(`
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

test('batch size groups objects in arrays of size', async ({ expect, writeStream, wrote }) => {

    new ReadJSONFile(EMOJIS)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new JSONStream({ batchSize: 2 }))
        .pipeTo(writeStream);

    expect(await wrote).toMatchInlineSnapshot(`
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

test('ignores context tokens in strings', async ({ expect, writeStream, wrote }) => {

    new ReadStringStream(`[{ "name": "fo]ol}\\"{yo[u" }]`)
        .pipeThrough(new JSONStream())
        .pipeTo(writeStream);

    expect(await wrote).toMatchInlineSnapshot(`
      [
        {
          "name": "fo]ol}"{yo[u",
        },
      ]
    `);
});

