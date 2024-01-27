import { beforeEach, describe, test } from 'vitest';
import { clearTemplates, makeRenderer } from './dom.js';

describe('isFragment', () => {

    beforeEach(clearTemplates);

    test('element root w/ false and true', async ({ expect }) => {
        const { root: div } = makeRenderer('element-root', `<div>text</div>`)();
        expect(div).toBeInstanceOf(HTMLDivElement);

        const { root: fragment } = makeRenderer('fragment-root', `<div>text</div>`, true)();
        expect(fragment).toBeInstanceOf(DocumentFragment);
    });

    test('fragment root w/ false and true', async ({ expect }) => {
        const { root: fragment } = makeRenderer('fragment-root', `<hr/><hr/><hr/>`, true)();
        expect(fragment).toBeInstanceOf(DocumentFragment);

        // TODO: should this be a thrown exception?
        const { root: hr } = makeRenderer('element-root', `<hr/><hr/><hr/>`)();
        expect(hr).toBeInstanceOf(HTMLHRElement);
    });
});
