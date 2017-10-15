import { module, test, fixture } from './qunit';
import { _, $ } from '../src/azoth';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';
import { Observable } from 'rxjs-es';

Observable.prototype.child = function(ref) {
    return this.pluck(ref).distinctUntilChanged();
};

module('destructured rendering', () => {

    test('object properties', t => {
        const template = ({ name, color }=$) => _`
            <span>*${name} the *${color.toUpperCase()}!</span>
        `;
        
        const item = new BehaviorSubject({ name: 'azoth', color: 'blue' });
        const fragment = template(item);
        t.ok(fragment.unsubscribe);

        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<span>azoth the BLUE!</span>');

        item.next({ name: 'Portland', color: 'red' });
        t.equal(fixture.cleanHTML(), '<span>Portland the RED!</span>');

        fragment.unsubscribe();
        item.next({ name: 'Nobody', color: 'transparent' });
        t.equal(fixture.cleanHTML(), '<span>Portland the RED!</span>');
    });

    test('Promise all', t => {
        const promises = Promise.all([
            Promise.resolve(5),
            Promise.resolve(2)
        ]);

        const template = ([x, y]=$) => _`*${x} + *${y} = *${x + y}`;
        
        const fragment = template(Observable.fromPromise(promises));
        fixture.appendChild(fragment);		
        t.equal(fixture.cleanHTML(), '+  =');

        const done = t.async();

        setTimeout(() => {
            t.equal(fixture.cleanHTML(), '5 + 2 = 7');            
            fragment.unsubscribe();
            done();
        });



    });


});