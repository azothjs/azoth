import Diamond from './Diamond';
import { test, module, fixture } from './qunit';

module( 'dom render' );

const { Binder } = Diamond;


test( 'simple node with text', t => {
	
	const binder = new Binder();
	binder.text( 't1', { ref: 'foo' } );
	
	const template = {
		fragment: Diamond.makeFragment(`
			<div>
				<text-slot data-bind="t1"></text-slot>
			</div>
		`),
		bindings: binder.bindings
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div>foo</div>' );
});

test( 'text node only', t => {
	
	const binder = new Binder();
	binder.text( 't1', { ref: 'foo' } );
	
	const template = {
		fragment: Diamond.makeFragment( `<text-slot data-bind="t1"></text-slot>` ),
		bindings: binder.bindings
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, 'foo' );
});


test( 'node with two bindings', t => {
	
	const binder = new Binder();
	binder.text( 'a1', { name: 'class', ref: 'klass' } );
	binder.text( 'p1', { name: 'value', ref: 'foo' } );
	
	const template = {
		fragment: Diamond.makeFragment(`
			<div>
				<input data-bind="a1,p1">
			</div>
		`),
		bindings: binder.bindings
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo', klass: 'bar' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div><input class="klass"></div>' );
	t.equal( fixture.children[0].children[0].value, 'foo' );
});


test( 'nested elements and text', t => {
	
	const binder = new Binder();
	binder.text( 't1', { ref: 'foo' } );
	binder.text( 't2', { ref: 'bar' } );
	
	const template = {
		fragment: Diamond.makeFragment(`
			<div>
				<span>
					<text-slot data-bind="t1"></text-slot>
				</span>
				<span>label: <text-slot data-bind="t2"></text-slot></span>
			</div>
		`),
		bindings: binder.bindings
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo', bar: 'bar' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div><span>foo</span><span>label: bar</span></div>' );
});


test( '#for section', t => {
		
	const binder = new Binder();
	binder.section( 's1', { type: 'for', ref: 'items' } );
	binder.text( 't1', { ref: '.' } );
	
	const template = {
		fragment: Diamond.makeFragment( `
			<ul>
				<section-slot data-bind="s1">
					<li><text-slot data-bind="t1"></text-slot></li>
				</section-slot>
			</ul>
		` ),
		bindings: binder.bindings
	};
	
	new Diamond( { 
		template, 
		data: { items: [ 1, 2, 3 ] }, 
		el: fixture 
	});	
	
	t.equal( fixture.innerHTML, '<ul><li>1</li><li>2</li><li>3</li><!--for--></ul>' );

});

test( '#for section - no top level element', t => {
		
	const binder = new Binder();
	binder.section( 's1', { type: 'for', ref: 'items' } );
	binder.text( 't1', { ref: '.' } );
	
	const template = {
		fragment: Diamond.makeFragment( `
			<section-slot data-bind="s1">
				<li><text-slot data-bind="t1"></text-slot></li>
			</section-slot>
		` ),
		bindings: binder.bindings
	};
	
	new Diamond( { 
		template, 
		data: { items: [ 1, 2, 3 ] }, 
		el: fixture 
	});	
	
	t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );

});

(function testIf() {
	
	const binder = new Binder();
	binder.section( 's1', { type: 'if', ref: 'condition' } );
	binder.text( 't1', { ref: 'foo' } );
	
	const template = {
		fragment: Diamond.makeFragment( `
			<section-slot data-bind="s1">
				<li><text-slot data-bind="t1"></text-slot></li>
			</section-slot>
		` ),
		bindings: binder.bindings
	};
	
	test( '#if section true', t => {
		new Diamond( { 
			template, 
			data: { condition: true, foo: 'foo' }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<li>foo</li><!--if-->' );
	});
	
	test( '#if section false', t => {
		new Diamond( { 
			template, 
			data: { condition: false, foo: 'foo' }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<!--if-->' );
	});
	
}());

// (function testWith() {
	
// 	const binder = new Binder();
// 	binder.section( 's1', { type: 'with', ref: 'obj' } );
// 	binder.text( 't1', { ref: 'a' } );
// 	binder.text( 't2', { ref: 'b' } );
	
// 	const template = {
// 		fragment: Diamond.makeFragment( `
// 			<section-slot data-bind="s1">
// 				<p>
// 					<text-slot data-bind="t1"></text-slot>
// 					<text-slot data-bind="t1"></text-slot>
// 				</p>
// 			</section-slot>
// 		` ),
// 		bindings: binder.bindings
// 	};
		
// 	test( '#with section', t => {
// 		new Diamond( { 
// 			template, 
// 			data: { obj: { a: 'A', b: 'B' } }, 
// 			el: fixture 
// 		});	
// 		t.equal( fixture.innerHTML, '<p>AB</p><!--with-->' );
// 	});

// 	test( '#with section, no object', t => {
// 		new Diamond( { 
// 			template, 
// 			data: {}, 
// 			el: fixture 
// 		});	
// 		t.equal( fixture.innerHTML, '<!--with-->' );
// 	});

// }());