import { module, test, fixture } from '../qunit';
import { _, $, KeyedList } from '../../src/azoth';
import { ReplaySubject } from 'rxjs-es/ReplaySubject';

module('Keyed List block component', () => {

    test('simple elements', t => {
        const template = (colors=$) => _`
            <ul>
                <#:${KeyedList(colors)} map=${color => _`<li>${color}</li>`}/>
            </ul>
        `;

        const colors = new ReplaySubject();
        colors.next({ action: 'added', item: 'red' });
        colors.next({ action: 'added', item: 'yellow' });
        colors.next({ action: 'added', item: 'blue' });
        
        const fragment = template(colors);
        fixture.appendChild(fragment);
        
        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><li>red</li><li>yellow</li><li>blue</li><!-- component end -->
            </ul>`
        );
    
        colors.next({ action: 'added', item: 'purple', next: 'yellow' });
        
        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><li>red</li><li>purple</li><li>yellow</li><li>blue</li><!-- component end -->
            </ul>`
        );

        colors.next({ action: 'moved', key: 'blue', next: 'red' });

        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><li>blue</li><li>red</li><li>purple</li><li>yellow</li><!-- component end -->
            </ul>`
        );

        colors.next({ action: 'removed', key: 'red' });

        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><li>blue</li><li>purple</li><li>yellow</li><!-- component end -->
            </ul>`
        );


        fragment.unsubscribe();

        t.equal(fixture.cleanHTML(), 
            `<ul>
                <!-- component start --><!-- component end -->
            </ul>`
        );
    });



});