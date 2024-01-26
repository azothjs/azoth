import { test } from 'vitest';
import fs from 'node:fs';
import { resolve } from 'node:path'

test('plugin output produces same snapshot', async ({ expect }) => {
    const expected = resolve(__dirname, './plugin.expected.js')
    const path = resolve(__dirname, './out/compiled.js')
    const output = fs.readFileSync(path, 'utf8');
    expect(output).toMatchFileSnapshot(expected)
})