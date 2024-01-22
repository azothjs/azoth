// @vitest-environment jsdom
import { beforeEach, test } from 'vitest';
import { compose } from './compose.js';


beforeEach(async (context) => {
    const li = document.createElement('li');
    li.className = 'travel';
    li.append(document.createTextNode('Hello'), document.createComment(0));
    context.dom = li;

});


test('no-op types don\'t access anchor', ({ expect, dom }) => {
    expect(dom).toBeDefined();
    const anchor = dom.lastChild;
    expect(anchor).toBeInstanceOf(Comment);

    const outerHTML = dom.outerHTML;
    expect(outerHTML).toMatchInlineSnapshot(
        `"<li class="travel">Hello<!--0--></li>"`
    );

    compose(undefined, anchor);
    expect(dom.outerHTML).toBe(outerHTML);

    compose(null, anchor);
    expect(dom.outerHTML).toBe(outerHTML);

    compose(true, anchor);
    expect(dom.outerHTML).toBe(outerHTML);

    compose(false, anchor);
    expect(dom.outerHTML).toBe(outerHTML);

    compose('', anchor);
    expect(dom.outerHTML).toBe(outerHTML);
});