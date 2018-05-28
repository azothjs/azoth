import { module, test, fixture } from '../qunit';
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

        test('function as map return', t => {
            block.map = cool => cool ? _`<span>blue</span>` : _`<span>blue</span>`;
            block.add();
            t.equal(fixture.cleanHTML(), '<span>blue</span><!--block-->');
        });

        test('array as map return', t => {
            block.map = () => [_`<span>blue</span>`, _`<span>red</span>`];
            block.add();
            t.equal(fixture.cleanHTML(), '<span>blue</span><span>red</span><!--block-->');
        });

        test('throws on non-DOM resolution', t => {
            block.map = () => ({});
            t.throws(() => {
                block.add();
            }, /Expected DOM/);
        });

        test('throws on no anchor', t => {
            let block = new CoreBlock();
            block.map = () => _`test`;
            t.throws(() => {
                block.add();
            }, /does not have an anchor/);
        });

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
                const h1 = document.createElement('h1');
                h1.textContent = 'Colors';
                fixture.insertBefore(h1, anchor);
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

    module('removeAt', hooks => {

        let block = null;

        hooks.beforeEach(() => block = new CoreBlock({ anchor }));
        hooks.afterEach(() => block.unsubscribe());

        test('removes top-level DOM based on index', t => {
            block.map = color => _`<span>${color}</span>`;

            block.add('blue');
            block.add('red');
            t.equal(fixture.cleanHTML(), '<span>blue</span><span>red</span><!--block-->');
            
            block.removeAt(0);
            t.equal(fixture.cleanHTML(), '<span>red</span><!--block-->');
        });

        test('removes multi-top level DOM based on index', t => {
            block.map = ({ color, count }) => _`<h3>${color}</h3><p>${count}</p>`;
            
            block.add({ color: 'blue', count: 4 });
            block.add({ color: 'red', count: 3 });
            t.equal(fixture.cleanHTML(), '<h3>blue</h3><p>4</p><h3>red</h3><p>3</p><!--block-->');

            block.removeAt(0);
            t.equal(fixture.cleanHTML(), '<h3>red</h3><p>3</p><!--block-->');
        });

        test('removes array top-level DOM based on index', t => {
            block.map = ({ color, count }) => [_`${color}`, _`${count}`];
            
            block.add({ color: 'blue', count: 4 });
            block.add({ color: 'red', count: 3 });
            t.equal(fixture.cleanHTML(), 'blue4red3<!--block-->');

            block.removeAt(0);
            t.equal(fixture.cleanHTML(), 'red3<!--block-->');
        });

    });


    module('adds at index', hooks => {

        let block = null;

        hooks.beforeEach(() => block = new CoreBlock({ anchor }));
        hooks.afterEach(() => block.unsubscribe());
        
        test('by value', t => {
            block.map = color => _`<li>${color}</li>`;

            block.add('blue');
            block.add('red');
            t.equal(fixture.cleanHTML(), '<li>blue</li><li>red</li><!--block-->');
            block.add('yellow', 1);
            t.equal(fixture.cleanHTML(), '<li>blue</li><li>yellow</li><li>red</li><!--block-->');
        });

        test('multi-top-level nodes from map', t => {
            block.map = ({ color, count }) => _`
                <h3>${color}</h3>
                <p>${count}</p>
            `;

            block.add({ color: 'blue', count: 4 });
            block.add({ color: 'red', count: 3 });
            t.contentEqual(fixture.cleanHTML(), '<h3>blue</h3><p>4</p><h3>red</h3><p>3</p><!--block-->');
            block.add({ color: 'yellow', count: 2 }, 1);
            t.contentEqual(fixture.cleanHTML(), '<h3>blue</h3><p>4</p><h3>yellow</h3><p>2</p><h3>red</h3><p>3</p><!--block-->');
        });

        test('function as map return', t => {
            block.map = cool => cool ? _`<span>red</span>` : _`<span>blue</span>`;
            block.add();
            block.add();
            t.equal(fixture.cleanHTML(), '<span>blue</span><span>blue</span><!--block-->');
            block.add(true, 1);
            t.equal(fixture.cleanHTML(), '<span>blue</span><span>red</span><span>blue</span><!--block-->');
        });

        test('array as map return', t => {
            block.map = high => high ? [_`three`, _`four`] : [_`one`, _`two`];
            block.add();
            block.add();
            t.equal(fixture.cleanHTML(), 'onetwoonetwo<!--block-->');
            block.add(true, 1);
            t.equal(fixture.cleanHTML(), 'onetwothreefouronetwo<!--block-->');
        });

    });
});