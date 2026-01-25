import { describe, test } from 'vitest';
import {
    elementWithTextAnchor,
    elementWithTextAnchorText,
    elementWithAnchor,
    elementWithAnchorText,
} from './elements.js';

describe('test util elements', () => {

    test('text-anchor', ({ expect }) => {
        expect(elementWithTextAnchor()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          Hello
          <!--0-->
        </div>,
      }
    `);
    });

    test('text-anchor-text', ({ expect }) => {
        expect(elementWithTextAnchorText()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          Hello
          <!--0-->
          Hello
        </div>,
      }
    `);
    });

    test('anchor', ({ expect }) => {
        expect(elementWithAnchor()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          <!--0-->
        </div>,
      }
    `);
    });

    test('anchor-text', ({ expect }) => {
        expect(elementWithAnchorText()).toMatchInlineSnapshot(`
      {
        "anchor": <!--0-->,
        "dom": <div>
          <!--0-->
          Hello
        </div>,
      }
    `);
    });
});
