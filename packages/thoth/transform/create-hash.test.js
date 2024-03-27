import { test } from 'vitest';
import { createHash } from './create-hash.js';

test('creates hash', async ({ expect }) => {
    const hash = await createHash('<p>html</p>');
    expect(await createHash('<p>html</p>')).toMatchInlineSnapshot(`"23ecabe4"`);
    expect(await createHash('p<>html</p>')).toMatchInlineSnapshot(`"93196638"`);
    expect(await createHash('<div>html</div>')).toMatchInlineSnapshot(`"8a3137d9"`);
    expect(await createHash('<p>html</p><p>html</p><p>html</p><p>html</p>')).toMatchInlineSnapshot(`"5b8ff6f1"`);
    expect(await createHash('<p>html</p><p>html</p><p>html</p>')).toMatchInlineSnapshot(`"0bc6706e"`);
});