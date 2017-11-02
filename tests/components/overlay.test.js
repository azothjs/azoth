import { module, test, fixture } from '../qunit';
import { _, $, Overlay } from '../../src/azoth';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';

module('Overlay block component', () => {

    test('single element', t => {
        const template = (colors=$) => _`
            <ul>
                <#:${Overlay(colors)} map=${(color=$) => _`<li>*${color}</li>`}/>
            </ul>
        `;

        const colors = new BehaviorSubject(['red', 'yellow', 'blue']);

        const fragment = template(colors);
        fixture.appendChild(fragment);

        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><li>red</li><li>yellow</li><li>blue</li><!-- component end -->
            </ul>`
        );

        colors.next(['purple', 'green', 'brown']);

        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><li>purple</li><li>green</li><li>brown</li><!-- component end -->
            </ul>`
        );

        colors.next(['white']);

        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><li>white</li><!-- component end -->
            </ul>`
        );

        colors.next(['red', 'blue', 'yellow']);

        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><li>red</li><li>blue</li><li>yellow</li><!-- component end -->
            </ul>`
        );

        fragment.unsubscribe();

        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><!-- component end -->
            </ul>`
        );
    });

    test('text and indexes', t => {
        const template = (colors=$) => _`<#:${Overlay(colors)} 
            map=${(color=$, index) => _`${index + 1}-*${color};`}
        />`;

        const colors = new BehaviorSubject(['red', 'yellow', 'blue']);

        const fragment = template(colors);
        fixture.appendChild(fragment);

        t.equal(fixture.cleanHTML(), 
            `<!-- component start -->1-red;2-yellow;3-blue;<!-- component end -->`
        );

        colors.next(['purple', 'green', 'brown']);

        t.equal(fixture.cleanHTML(), 
            `<!-- component start -->1-purple;2-green;3-brown;<!-- component end -->`
        );

        colors.next(['white']);

        t.equal(fixture.cleanHTML(), 
            `<!-- component start -->1-white;<!-- component end -->`
        );

        colors.next(['red', 'blue', 'yellow']);

        t.equal(fixture.cleanHTML(), 
            `<!-- component start -->1-red;2-blue;3-yellow;<!-- component end -->`
        );

        fragment.unsubscribe();

        t.equal(fixture.cleanHTML(), 
            `<!-- component start --><!-- component end -->`
        );
    });

});