import { module, test, fixture } from './qunit';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';
import { Observable } from 'rxjs-es';
import { map, combine } from '../src/observable-expressions';

module('custom observable functions', () => {

    test('map', t => {
        const x = new BehaviorSubject(5);
        let current = -1;
        let count = 0;
        const binding = val => {
            current = val;
            count++;
        }

        map(x, x => x*x, binding);
        
        t.equal(current, 25);
        t.equal(count, 1);
        
        x.next(2);
        t.equal(count, 2);
        t.equal(current, 4);

        x.next(2);
        t.equal(count, 2);
        t.equal(current, 4);
    });

    test('map only fires when mapped value changes', t => {
        const x = new BehaviorSubject(8);
        let current = '';
        let count = 0;
        const binding = val => {
            current = val;
            count++;
        }

        map(x, x => x > 5 ? 'high' : 'low', binding);
        
        t.equal(current, 'high');
        t.equal(count, 1);
        
        x.next(6);
        t.equal(current, 'high');
        t.equal(count, 1);
    });

    test('combine', t => {
        const x = new BehaviorSubject(2);
        const y = new BehaviorSubject(5);
        const z = new BehaviorSubject(1);
        
        let current = -1;
        let count = 0;
        const binding = val => {
            current = val;
            count++;
        }

        combine([x, y, z], (x, y, z) => x + y + z, binding);
        
        t.equal(current, 8);
        t.equal(count, 1);
        
        x.next(2);
        t.equal(current, 8);
        t.equal(count, 1);

        x.next(3);
        t.equal(current, 9);
        t.equal(count, 2);

        x.next(1);
        y.next(2);
        z.next(3);
        t.equal(current, 6);
        t.equal(count, 5);
    });

    test('combine only fires when combined value changes', t => {
        const x = new BehaviorSubject(0);
        const y = new BehaviorSubject(1);
        let current = '';
        let count = 0;
        const binding = val => {
            current = val;
            count++;
        }

        combine([x, y], (x, y) => x * y, binding);
        
        t.equal(current, 0);
        t.equal(count, 1);
        
        y.next(0);
        t.equal(count, 1);

        x.next(5);
        t.equal(count, 1);
    });

    test('combine fires only when at least one input fires', t => {
        const x = Observable.from(Promise.resolve(3));
        const y = Observable.from(Promise.resolve(2));
        
        let current = -1;
        let count = 0;
        const binding = val => {
            current = val;
            count++;
        }

        combine([x, y], (x, y) => x + y, binding);
        
        t.equal(current, -1);
        t.equal(count, 0);

        const done = t.async();

        setTimeout(() => {
            t.equal(current, 5);
            t.equal(count, 2);
            done();
        });
        
    });
});