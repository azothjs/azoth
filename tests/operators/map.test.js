import { module, test } from '../qunit';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';
import { Observable } from 'rxjs-es';
import map from '../../src/operators/map';
import getBinding from './get-binding';

module('observable functions - map', () => {

    test('basic', t => {
        const x = new BehaviorSubject(5);
        const b = getBinding();

        const subscription = map(x, x => x*x, b);
        
        t.equal(b.value, 25);
        t.equal(b.count, 1);
        
        x.next(2);
        t.equal(b.count, 2);
        t.equal(b.value, 4);

        x.next(2);
        t.equal(b.count, 2);
        t.equal(b.value, 4);

        subscription.unsubscribe();
        x.next(10);
        t.equal(b.count, 2);
        t.equal(b.value, 4);
    });

    test('map only fires when mapped value changes', t => {
        const x = new BehaviorSubject(8);
        const b = getBinding();

        const subscription = map(x, x => x > 5 ? 'high' : 'low', b);
        
        t.equal(b.value, 'high');
        t.equal(b.count, 1);
        
        x.next(6);
        t.equal(b.value, 'high');
        t.equal(b.count, 1);

        subscription.unsubscribe();
        x.next(1);
        t.equal(b.value, 'high');
        t.equal(b.count, 1);
    });

    test('first', t => {
        const x = new BehaviorSubject(5);
        const b = getBinding();

        const subscription = map(x, x => x*x, b, true);
        
        t.equal(b.value, 25);
        t.equal(b.count, 1);
        
        x.next(2);
        t.equal(b.value, 25);
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

        map(x, x => x*x, b, true);
        
        t.equal(b.value, null);
        t.equal(b.count, 0);
        
        const done = t.async();

        setTimeout(() => {
            t.equal(b.value, 9);
            t.equal(b.count, 1);
            setTimeout(() => {
                t.equal(b.value, 9);
                t.equal(b.count, 1);
                done();
            }, 7);
        });
    });

});