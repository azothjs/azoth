import { module, test, assert, fixture } from '../qunit';
import { _, $ } from '../../src/azoth';
import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';

module('block binder', () => {
    
    const testFragment = (fragment, expected) => {
        assert.ok(fragment.unsubscribe);
        fixture.appendChild(fragment);
        assert.equal(fixture.cleanHTML(), expected);
        fragment.unsubscribe();
    };
    
    module('basic block insertion', () => {
        
        const template = block => _`${block}#`;

        const testBlock = (block, expected) => {
            const fragment = template(block);
            testFragment(fragment, expected);
        };
        
        test('template', () => {
            const block = _`<span>block</span`;
            testBlock(block, '<span>block</span>');
        });

        test('array of templates', () => {
            const block = [
                _`<span>one</span`,
                _`<span>two</span`,
                _`<span>three</span`
            ];
            testBlock(block, '<span>one</span><span>two</span><span>three</span>');
        });

        test('array of templates with holes', () => {
            const block = [
                null,
                _`<span>two</span`,
                null
            ];
            testBlock(block, '<span>two</span>');
        });

        test('dom node', () => {
            const block = document.createElement('DIV');
            testBlock(block, '<div></div>');            
        });
    });

    test('sibling block binders', t => {
        const div = val => _`<div>${val}</div>`

        const template = (first=$, second=$) => _`
            *${div(first)}#
            *${div(second)}#
        `;

        const one = new BehaviorSubject('first');
        const two = new BehaviorSubject();
        const fragment = template(one, two);
        two.next('second');
        testFragment(fragment, '<div>first</div><div>second</div>'); 
    });
});