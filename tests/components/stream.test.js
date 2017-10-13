import { module, test, fixture, skip } from '../qunit';
import { _, $, Stream } from '../../src/azoth';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';
import { Observable } from 'rxjs-es/Observable';
import 'rxjs-es/add/observable/of';

module('Stream component', () => {

    skip.test('observable to single template', t => {
        const template = (name=$) => _`<div><#:${Stream(name)}>${value => _`<span>${value}</span>`}</#:></div>`;
        const name = new BehaviorSubject('Hello');
        const fragment = template(name);

        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<div><!-- component start --><span>Hello</span><!-- component end --></div>');
        
        name.next(' ');
        name.next('World');
        t.equal(fixture.cleanHTML(), '<div><!-- component start --><span>Hello</span><span> </span><span>World</span><!-- component end --></div>');
        
        fragment.unsubscribe();
        t.equal(fixture.cleanHTML(), '<div><!-- component start --><!-- component end --></div>');
    });

    skip.test('iterative array with single templates', t => {
        const template = (colors=$) => _`<ul><#:${Stream(colors)}>${color => _`<li>${color}</li>`}</#:></ul>`;
        const colors = Observable.of('red', 'green', 'blue');
        const fragment = template(colors);
        
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<ul><!-- component start --><li>red</li><li>green</li><li>blue</li><!-- component end --></ul>');
        
        fragment.unsubscribe();
        t.equal(fixture.cleanHTML(), '<ul><!-- component start --><!-- component end --></ul>');
    });


});