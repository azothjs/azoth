import { module, test } from '../qunit';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';
import { Observable } from 'rxjs-es';
import combine from '../../src/operators/combine';
import getBinding from './get-binding';

module('observable functions - combine', () => {

    // TODO: add unsubscribe tests

    test('basic', t => {
        const x = new BehaviorSubject(2);
        const y = new BehaviorSubject(5);
        const z = new BehaviorSubject(1);
        const b = getBinding();

        const subscription = combine([x, y, z], (x, y, z) => x + y + z, b);
        
        t.equal(b.value, 8);
        t.equal(b.count, 1);
        
        x.next(2);
        t.equal(b.value, 8);
        t.equal(b.count, 1);

        x.next(3);
        t.equal(b.value, 9);
        t.equal(b.count, 2);

        x.next(1);
        y.next(2);
        z.next(3);
        t.equal(b.value, 6);
        t.equal(b.count, 5);

        subscription.unsubscribe();
        x.next(11);
        y.next(22);
        z.next(33);
        t.equal(b.value, 6);
        t.equal(b.count, 5);
    });

    test('combine only fires when combined value changes', t => {
        const x = new BehaviorSubject(0);
        const y = new BehaviorSubject(1);
        const b = getBinding();

        const subscription = combine([x, y], (x, y) => x * y, b);
        
        t.equal(b.value, 0);
        t.equal(b.count, 1);
        
        y.next(0);
        t.equal(b.count, 1);

        x.next(5);
        t.equal(b.count, 1);

        subscription.unsubscribe();
    });

    test('combine fires only when at least one input fires', t => {
        const x = Observable.from(Promise.resolve(3));
        const y = Observable.from(Promise.resolve(2));
        const b= getBinding();

        combine([x, y], (x, y) => x + y, b);
        
        t.equal(b.value, null);
        t.equal(b.count, 0);

        const done = t.async();

        setTimeout(() => {
            t.equal(b.value, 5);
            t.equal(b.count, 2);
            done();
        });
        
    });

    test('first', t => {
        const x = new BehaviorSubject(2);
        const y = new BehaviorSubject(5);
        const z = new BehaviorSubject(1);
        const b = getBinding();

        const subscription = combine([x, y, z], (x, y, z) => x + y + z, b, true);
        
        t.equal(b.value, 8);
        t.equal(b.count, 1);
        

        x.next(1);
        y.next(2);
        z.next(3);
        t.equal(b.value, 8);
        t.equal(b.count, 1);
        
        subscription.unsubscribe();
    });

    test('first async', t => {
        const x = Observable.create(observer => {
            setTimeout(() => observer.next(2));
            setTimeout(() => observer.next(50), 6);

        });
        const y = Observable.create(observer => {
            setTimeout(() => observer.next(5));
            setTimeout(() => observer.next(50), 6);

        });
        const z = Observable.create(observer => {
            setTimeout(() => observer.next(1));
            setTimeout(() => observer.next(50), 6);

        });
        const b = getBinding();

        combine([x, y, z], (x, y, z) => x + y + z, b, true);
        
        t.equal(b.value, null);
        t.equal(b.count, 0);
        
        const done = t.async();

        setTimeout(() => {
            t.equal(b.value, 8);
            t.equal(b.count, 3);
            setTimeout(() => {
                t.equal(b.value, 8);
                t.equal(b.count, 3);
                done();
            }, 7);
        });

    });
});