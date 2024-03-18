import { beforeEach, describe, test } from 'vitest';
import { DOMRenderer } from './dom-renderer.js';

describe('DOM isFragment', () => {

    test('element root w/ false and true', async ({ expect }) => {
        const [div] = DOMRenderer.createTemplate('element-root', false, `<div>text</div>`)();
        expect(div).toBeInstanceOf(HTMLDivElement);

        const [fragment] = DOMRenderer.createTemplate('fragment-root', true, `<div>text</div>`)();
        expect(fragment).toBeInstanceOf(DocumentFragment);
    });

    test('fragment root w/ false and true', async ({ expect }) => {
        const [fragment] = DOMRenderer.createTemplate('fragment-root', `<hr/><hr/><hr/>`, true)();
        expect(fragment).toBeInstanceOf(DocumentFragment);

        // TODO: should this be a thrown exception?
        const [hr] = DOMRenderer.createTemplate('element-root', `<hr/><hr/><hr/>`)();
        expect(hr).toBeInstanceOf(HTMLHRElement);
    });
});
