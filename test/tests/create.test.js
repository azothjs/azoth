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
	
	
	const template = document.createElement('template');
	template.innerHTML = `<div><span>Hello </span></div>`;
	
	const fragment = template.content;
	ontemplate( fragment );
	const getClone = () => fragment.cloneNode( true );
	
	function ontemplate( node ) {
		node.children[0].children[0].childNodes[0].splitText(6);
	}
	
	function onbind( context, node ) {
		node.children[0].children[0].childNodes[1].textContent = context.val();
	}
		
	test( 'text node splits on template', t => {
		var clone = getClone();
		t.equal( clone.children[0].children[0].childNodes.length, 2 );
				
		fixture.appendChild( clone );
		t.equal( fixture.innerHTML, '<div><span>Hello </span></div>' );	
	});	
	
	test( 'bind updates second text node', t => {
		const clone = getClone();
		const context = { val: () => 'World' };
		
		onbind( context, clone );
		
		fixture.appendChild( clone );
		t.equal( fixture.innerHTML, '<div><span>Hello World</span></div>' );
	});
	


})();