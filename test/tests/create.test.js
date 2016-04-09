import dom from './template/dom';
import getBindingTree from './getBindingTree';

const test = QUnit.test;
const module = QUnit.module;

QUnit.dump.maxDepth = 0;

const fixture = document.getElementById( 'qunit-fixture' );

const getElement = ( name, children ) => ({ type: 'element', name, children });

const { $, Đ } = dom;

(function(){	
	
	module( 'create' );

	const t1 = Đ.text({ ref: 'place' });
	
	const fragment = $([
		$.el( 'div',[
			$.el( 'span',[ 
				$.text( 'Hello ' ),  
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