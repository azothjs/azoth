import { module, test, fixture } from './qunit';
import { html as _ } from '../src/diamond';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';
import { combineLatest } from 'rxjs-es/observable/combineLatest';
import { Observable } from 'rxjs-es';

module('mapped expression rendering', () => {

    test('hello diamond', t => {
        const template = (name=$) => _`<span>Hello *${name}!</span>`;
        
        const name = new BehaviorSubject('Diamond');
        const fragment = template(name);
        t.ok(fragment.unsubscribe);

        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<span>Hello Diamond!</span>');
        name.next('Portland');
        t.equal(fixture.cleanHTML(), '<span>Hello Portland!</span>');
        fragment.unsubscribe();
        name.next('Not Listening')
        t.equal(fixture.cleanHTML(), '<span>Hello Portland!</span>');
    });

    test('expression', t => {
        const template = (x=$, y=$) => _`*${x} + *${y} = *${x + y}`;
        
        const x = new BehaviorSubject(5);
        const y = new BehaviorSubject(2);

        const fragment = template(x, y);
        fixture.appendChild(fragment);		
        t.equal(fixture.cleanHTML(), '5 + 2 = 7');

		x.next(3);
		t.equal(fixture.cleanHTML(), '3 + 2 = 5');
		y.next(1);
		t.equal(fixture.cleanHTML(), '3 + 1 = 4');

        fragment.unsubscribe();

		y.next(10);
		t.equal(fixture.cleanHTML(), '3 + 1 = 4');

    });

    test('conditional block with variables', t => {
        const yes = _`<span>Yes</span>`;
        const no = _`<span>No</span>`
        const template = (choice=$) => _`*${choice ? yes : no}#`;

        const choice = new BehaviorSubject(true);
        const fragment = template(choice);
        fixture.appendChild(fragment);

        t.equal(fixture.cleanHTML(), '<span>Yes</span>');
        
        choice.next(false);
        t.equal(fixture.cleanHTML(), '<span>No</span>');
        
        fragment.unsubscribe();
        
        choice.next(true);
        t.equal(fixture.cleanHTML(), '<span>No</span>');
    });

    test('block with array', t => {
        const template = (items=$) => _`
            <ul>
                *${items.map(({ name }) => _`
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
                <li>goat</li>
                <li>dragon</li>
                <li>hot dog</li>
            </ul>
        `);

        fragment.unsubscribe();
    });


});