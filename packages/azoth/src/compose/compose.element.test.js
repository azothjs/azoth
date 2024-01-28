import { describe, test, expect } from 'vitest';
import { composeElement } from './compose.js';
import { $div, elementWithAnchor, elementWithTextAnchor, runCompose } from './test-elements.test.js';


describe('compose element', () => {

    test('instantiate with props', ({ expect }) => {
        // arrange

        function Component({ name }) {
            // <div>{name}</div>
            return runCompose(name, elementWithAnchor);
        }

        const { dom, anchor } = elementWithTextAnchor();

        // act 
        composeElement(Component, anchor, { name: 'felix' });

        // assert
        expect(dom).toMatchInlineSnapshot(`
          <div>
            Hello
            <div>
              felix
              <!--1-->
            </div>
            <!--1-->
          </div>
        `);



    });
});


