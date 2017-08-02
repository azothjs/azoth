import { module, test, fixture } from '../qunit';
import { _, $ } from '../../src/azoth';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';

module('first expression rendering', () => {

    test('hello azoth', t => {
        const template = (name=$) => _`<span>Hello $${name}!</span>`;
        
        const name = new BehaviorSubject('azoth');
        const fragment = template(name);
        t.ok(fragment.unsubscribe);

        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<span>Hello azoth!</span>');
        name.next('Not Listening');
        t.equal(fixture.cleanHTML(), '<span>Hello azoth!</span>');
        // still safe to call
        fragment.unsubscribe();
    });

    test('expression', t => {
        const template = (x=$, y=$) => _`$${x} + $${y} = $${x + y}`;
        
        const x = new BehaviorSubject(5);
        const y = new BehaviorSubject(2);

        const fragment = template(x, y);
        fixture.appendChild(fragment);		
        t.equal(fixture.cleanHTML(), '5 + 2 = 7');

        x.next(3);
        y.next(1);
        t.equal(fixture.cleanHTML(), '5 + 2 = 7');
    });

    test('attribute', t => {
        const template = (foo=$) => _`<span class=$${foo}></span>`;
       
        const foo = new BehaviorSubject('foo');
        const fragment1 = template(foo);
        fixture.appendChild(fragment1);		
        t.equal(fixture.cleanHTML(), '<span class="foo"></span>');

        foo.next('bar');
        t.equal(fixture.cleanHTML(), '<span class="foo"></span>');
    });

    test('conditional block with variables', t => {
        const yes = _`<span>Yes</span>`;
        const no = _`<span>No</span>`;
        const template = (choice=$) => _`$${choice ? yes : no}#`;

        const choice = new BehaviorSubject(true);
        const fragment = template(choice);
        fixture.appendChild(fragment);

        t.equal(fixture.cleanHTML(), '<span>Yes</span>');
        
        choice.next(false);
        t.equal(fixture.cleanHTML(), '<span>Yes</span>');
    });

    test('block with array', t => {
        const template = (items=$) => _`
            <ul>
                $${items.map(({ name }) => _`
                    <li>${name}</li>	
                `)}#
            </ul>
        `;

        const items = new BehaviorSubject([
            { name: 'balloon' },
            { name: 'hammer' },
            { name: 'lipstick' },
        ]);

        const fragment = template(items);
        fixture.appendChild(fragment);
        
        t.contentEqual(fixture.cleanHTML(), `
            <ul>
                <li>balloon</li>
                <li>hammer</li>
                <li>lipstick</li>
            </ul>
        `);

        items.next([
            { name: 'goat' },
            { name: 'dragon' },
            { name: 'hot dog' },
        ]);

        t.contentEqual(fixture.cleanHTML(), `
            <ul>
                <li>balloon</li>
                <li>hammer</li>
                <li>lipstick</li>
            </ul>
        `);
    });


});