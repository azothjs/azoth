import Diamond from './Diamond';
import { test, module, fixture } from './qunit';

module( 'dom render' );

const { bound } = Diamond;


test( 'simple node with text', t => {
	
	const template = {
		fragment: Diamond.makeFragment( 
			`<div data-bind><text-node></text-node></div>`
		),
		bindings: [ bound.text( { ref: 'foo' } ) ]
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div>foo</div>' );
});

test( 'text node only', t => {
	
	const template = {
		fragment: Diamond.makeFragment( 
			`<text-node data-bind></text-node>` ),
		bindings: [
			bound.childText( { ref: 'foo' } )
		]
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, 'foo' );
});

test( 'node with two bindings', t => {
	
	const template = {
		fragment: Diamond.makeFragment(`
			<div>
				<input data-bind>
			</div>
		`),
		bindings: [
			bound.wrap([
				bound.attribute( { name: 'class', ref: 'klass' } ),
				bound.property( { name: 'value', ref: 'foo' } )	
			])
		]
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo', klass: 'editable' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div><input class="editable"></div>' );
	t.equal( fixture.children[0].children[0].value, 'foo' );
});


test( 'nested elements and text', t => {

	const template = {
		fragment: Diamond.makeFragment(`
			<div>
				<span data-bind></span>
				<span data-bind>label: <text-node></text-node></span>
			</div>
		`),
		bindings: [
			bound.text( { ref: 'foo' } ),
			bound.childText( { ref: 'bar', index: 1 } )
		]
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo', bar: 'bar' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div><span>foo</span><span>label: bar</span></div>' );
});

(function testFor(){
	
	const bindings = [
		bound.section( { type: 'for', ref: 'items' }, {
			fragment: Diamond.makeFragment( 
				`<li data-bind></li>`
			),
			bindings: [
				bound.text( { ref: '.' } )
			]
		})
	];
	
	test( '#for section', t => {

		const template = {
			fragment: Diamond.makeFragment( `
				<ul data-bind>
					<section-node></section-node>
				</ul>
			` ),
			bindings
		};
		
		new Diamond( { 
			template, 
			data: { items: [ 1, 2, 3 ] }, 
			el: fixture 
		});	
		
		t.equal( fixture.innerHTML, '<ul><li>1</li><li>2</li><li>3</li><!--for--></ul>' );

	});

	test( '#for section - no top level element', t => {
			

		const template = {
			fragment: Diamond.makeFragment( `
				<section-node></section-node>
			` ),
			bindings
		};
		
		new Diamond( { 
			template, 
			data: { items: [ 1, 2, 3 ] }, 
			el: fixture 
		});	
		
		t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );

	});
}());

(function testIf() {
	
	const template = {
		fragment: Diamond.makeFragment( `
			<section-node></section-node>
		` ),
		bindings: [
			bound.section( { type: 'if', ref: 'condition' }, {
				fragment: Diamond.makeFragment( 
					`<li data-bind><text-node></text-node></li>`
				),
				bindings: [
					bound.text( { ref: 'foo' } )
				]
			})
		]
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

(function testWith() {
	
	const template = {
		fragment: Diamond.makeFragment( `
			<section-node></section-node>
		` ),
		bindings: [
			bound.section( { type: 'with', ref: 'obj' }, {
				fragment: Diamond.makeFragment( 
					`<p data-bind>
						<text-node></text-node>
						<text-node></text-node>
					</p>`
				),
				bindings: [
					bound.wrap([
						bound.childText( { ref: 'a' } ),
						bound.childText( { ref: 'b', index: 1 } )
					])
				]
			})
		]
	};
		
	test( '#with section', t => {
		new Diamond( { 
			template, 
			data: { obj: { a: 'A', b: 'B' } }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<p>AB</p><!--with-->' );
	});

	test( '#with section, no object', t => {
		new Diamond( { 
			template, 
			data: {}, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<!--with-->' );
	});

}());