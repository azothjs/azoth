import { module, test, fixture, skip } from '../qunit';
import { _, $ } from '../../src/azoth';
import Observable from '../../src/observables/observable1';
import CoreBlock from './sut';

module('Core Block Operations', hooks => {

    let anchor = null;

    hooks.beforeEach(t => {
        // QUnit is suppose to clear this between tests :shrug:
        fixture.innerHTML = ''; 
        t.equal(fixture.innerHTML, '', 'fixture is reset');
        anchor = document.createComment('block');
        fixture.appendChild(anchor);
    });

    module('adds', hooks => {

        let block = null;

        hooks.beforeEach(() => block = new CoreBlock({ anchor }));
        hooks.afterEach(() => block.unsubscribe());
        
        test('by value', t => {
            block.map = color => _`<span>${color}</span>`;

            block.add('blue');
            t.equal(fixture.cleanHTML(), '<span>blue</span><!--block-->');
            block.add('red');
            t.equal(fixture.cleanHTML(), '<span>blue</span><span>red</span><!--block-->');
        });

        test('by observable-based value with unsubscribes', t => {
            block.map = (color=$) => _`<span>*${color}</span>`;

            const blue = new Observable('blue');
            const red = new Observable('red');
        
            block.add(blue);
            block.add(red);
            t.equal(fixture.cleanHTML(), '<span>blue</span><span>red</span><!--block-->');
        
            block.unsubscribe();
            blue.next('purple');
            red.next('orange');
            t.equal(fixture.cleanHTML(), '<span>blue</span><span>red</span><!--block-->');
        });


        test('multi-top-level nodes from map', t => {
            block.map = ({ color, count }) => _`
                <h3>${color}</h3>
                <p>${count}</p>
            `;

            block.add({ color: 'blue', count: 4 });
            t.contentEqual(fixture.cleanHTML(), '<h3>blue</h3><p>4</p><!--block-->');
            block.add({ color: 'red', count: 3 });
            t.contentEqual(fixture.cleanHTML(), '<h3>blue</h3><p>4</p><h3>red</h3><p>3</p><!--block-->');
        });

        // map returns function
        // map returns array
        // map returns object
        // map returns primitive

    });

    module('clear', () => {

        let block = null;

        hooks.beforeEach(() => block = new CoreBlock({ anchor }));
        hooks.afterEach(() => block.unsubscribe());

        function testClear(name, map) {
            test(`${name} cleared with no siblings`, t => {
                block.map = map;
                block.add('blue');
                block.add('red');
                block.clear();
    
                t.equal(fixture.cleanHTML(), '<!--block-->');
            });
    
            test(`${name} cleared with existing prior sibling`, t => {
                const span = document.createElement('h1');
                span.textContent = 'Colors';
                fixture.insertBefore(span, anchor);
                t.equal(fixture.cleanHTML(), '<h1>Colors</h1><!--block-->', 'has existing sibling');
    
                block.anchor = anchor;
                block.map = map;
                block.add('blue');
                block.add('red');
                block.clear();
    
                t.equal(fixture.cleanHTML(), '<h1>Colors</h1><!--block-->');
            });
        }

        testClear('single top-level', color => _`<span>${color}</span>`);
        testClear('multi top-level', ({ color, count }) => _`<h3>${color}</h3><p>${count}</p>`);
        
    });

    module('removes', hooks => {

        let block = null;

        hooks.beforeEach(() => block = new CoreBlock({ anchor }));
        hooks.afterEach(() => block.unsubscribe());

        test('removes DOM based on index', t => {
            block.map = color => _`<span>${color}</span>`;

            block.add('blue');
            block.add('red');
            t.equal(fixture.cleanHTML(), '<span>blue</span><span>red</span><!--block-->');
            
            block.removeByIndex(0);
            t.equal(fixture.cleanHTML(), '<span>red</span><!--block-->');
        });

    });
});