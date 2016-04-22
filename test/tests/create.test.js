import dom from './template/dom';
import getBindingTree from './getBindingTree';

const test = QUnit.test;
const module = QUnit.module;

QUnit.dump.maxDepth = 0;

const fixture = document.getElementById( 'qunit-fixture' );

const getElement = ( name, children ) => ({ type: 'element', name, children });

const { $tatic, bound } = dom;

(function(){	
	
	module( 'create' );

	const t1 = bound.text({ ref: 'place' });
	
	const fragment = $tatic([
		$tatic.el( 'div', null,[
			$tatic.el( 'span', null,[ 
				$tatic.text( 'Hello ' ),  
				t1
			])
		])
	]);

	test( 'dom fragment', t => {
		fixture.appendChild( fragment.cloneNode( true ) );
		t.equal( fixture.innerHTML, '<div><span>Hello </span></div>' );	
	});

	test( 'binding tree', t => {
		t.deepEqual( getBindingTree( fragment.childNodes ), [{
			children: [{
				children: [{
					index: 1,
					bindings: [ t1 ]
				}]	
			}]
		}]);
	});

})();