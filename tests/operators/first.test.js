import { module, test } from '../qunit';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';
import { Observable } from 'rxjs-es';
import first from '../../src/operators/first';
import getBinding from './get-binding';

module('observable functions - first', () => {

    test('first', t => {
        const x = new BehaviorSubject(5);
        const b = getBinding();

        const subscription = first(x, b, true);
        
        t.equal(b.value, 5);
        t.equal(b.count, 1);
        
        x.next(2);
        t.equal(b.value, 5);
        t.equal(b.count, 1);

        // should be safe to call...
        subscription.unsubscribe();
    });

    test('first async', t => {
        const x = Observable.create(observer => {
            setTimeout(() => observer.next(3));
            setTimeout(() => observer.next(5), 6);

        });
        
        const b = getBinding();

        first(x, b, true);
        
        t.equal(b.value, null);
        t.equal(b.count, 0);
        
        const done = t.async();

        setTimeout(() => {
            t.equal(b.value, 3);
            t.equal(b.count, 1);
            setTimeout(() => {
                t.equal(b.value, 3);
                t.equal(b.count, 1);
                done();
            }, 7);
        });
    });

});