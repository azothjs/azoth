import { module, test, fixture } from '../qunit';
import { _, $, Widget } from '../../src/azoth';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';

module('Widget component', () => {

    class SimpleWidget extends Widget {
        render() {
            return _`<div>Hello Widget</div>`;
        }
    }
    
    class PropsWidget extends Widget {
        constructor() {
            super();
            this.type = 'text';
        }

        renderWith() {
            return this.render(this.value);
        }

        render(value=$) {
            return _`
                <div>Hello *${value}</div>
                <input type=${this.type}>
            `;
        }
    }

    test('simple widget', t => {
        const template = () => _`<#:${new SimpleWidget()}/>`;
        const fragment = template();
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), `<!-- component start --><div>Hello Widget</div><!-- component end -->`);
    });


    test('simple widget with props', t => {
        const template = value => _`<#:${new PropsWidget()} type="text" value=${value}/>`;
        const value = new BehaviorSubject('one');
        
        const fragment = template(value);
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), 
            `<!-- component start --><div>Hello one</div>
                <input type="text"><!-- component end -->`);

        value.next('two');
        t.equal(fixture.cleanHTML(), 
            `<!-- component start --><div>Hello two</div>
                <input type="text"><!-- component end -->`);

        fragment.unsubscribe();
        value.next('three');
        t.equal(fixture.cleanHTML(), 
            `<!-- component start --><div>Hello two</div>
                <input type="text"><!-- component end -->`);
    });

});