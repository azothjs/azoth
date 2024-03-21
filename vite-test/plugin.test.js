/* eslint-disable no-undef */
import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('plugin output produces same snapshot', async ({ expect }) => {
    const expectedHTML = resolve(__dirname, './expected-out/index.html');
    const actualHTML = await readFile(resolve(__dirname, './out/index.html'), 'utf8');
    expect(actualHTML).toMatchFileSnapshot(expectedHTML);

    // These are hard coded as vitest was throwing file read errors trying to do 
    // it programmatically. Likely need to work out directory permission. 
    // When that's done, switch to dir-compare

    const expectedJS = resolve(__dirname, './expected-out/index-CHvwx500.js');
    const actualJS = await readFile(resolve(__dirname, './out/index-CHvwx500.js'), 'utf8');
    expect(actualJS).toMatchFileSnapshot(expectedJS);

    const expectedCSS = resolve(__dirname, './expected-out/index-DDapMaSx.css');
    const actualCSS = await readFile(resolve(__dirname, './out/index-DDapMaSx.css'), 'utf8');
    expect(actualCSS).toMatchFileSnapshot(expectedCSS);
});