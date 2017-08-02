import { module, test, fixture } from '../qunit';
import { _, $, Block } from '../../src/azoth';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';

module('Block component', () => {

    test('observable to single template', t => {
        const template = (name=$) => _`<div><#:${Block(name)}>${value => _`<span>${value}</span>`}</#:></div>`;
        const name = new BehaviorSubject('Hello World');
        const fragment = template(name);
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<div><!-- component start --><span>Hello World</span><!-- component end --></div>');
        fragment.unsubscribe();
        t.equal(fixture.cleanHTML(), '<div><!-- component start --><!-- component end --></div>');
    });

    test('observable to array of templates', t => {
        const template = (colors=$) => _`<ul><#:${Block(colors)}>${colors=> colors.map(color => _`<li>${color}</li>`)}</#:></ul>`;
        const colors = new BehaviorSubject(['red', 'green', 'blue']);
        const fragment = template(colors);
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<ul><!-- component start --><li>red</li><li>green</li><li>blue</li><!-- component end --></ul>');
        fragment.unsubscribe();
        t.equal(fixture.cleanHTML(), '<ul><!-- component start --><!-- component end --></ul>');
    });


});