import Diamond from './Diamond';
import { test, module, fixture } from './qunit';

module( 'dom render' );

const { bound } = Diamond;

test( 'simple node with text', t => {
	
	const template = {
		fragment: Diamond.makeFragment( 
			`<div data-bind></div>`
		),
		bindings() {
			const b1 = bound.text( { ref: 'foo' } );
			return ( nodes, context ) => {
				b1( nodes[0], context );
			};
		}	
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
		bindings() {
			const b1 = bound.childText( { ref: 'foo' } );
			return ( nodes, context, fragment ) => {
				b1( fragment, context );
			};
		}
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
		fragment: Diamond.makeFragment(`<div><input data-bind></div>`),
		bindings() {
			const b1 = bound.attribute( { name: 'class', ref: 'klass' } );
			const b2 = bound.property( { name: 'value', ref: 'foo' } );
			return ( nodes, context ) => {
				b1( nodes[0], context );
				b2( nodes[0], context );
			};
		}
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo', klass: 'editable' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div><input class="editable"></div>' );
	t.equal( fixture.children[0].children[0].value, 'foo' );
});

test( 'node with two text bindings', t => {
	const template = {
		fragment: Diamond.makeFragment(
			`<div data-bind><text-node></text-node>: <text-node></text-node></div>`
		),
		bindings() {
			const b1 = bound.childText( { ref: 'foo' } );
			const b2 = bound.childText( { ref: 'bar', index: 2 } );	
			return ( nodes, context ) => {
				b1( nodes[0], context );
				b2( nodes[0], context );
			};
		}
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo', bar: 'bar' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div>foo: bar</div>' );
});


test( 'nested elements and text', t => {

	const template = {
		fragment: Diamond.makeFragment(
			`<div>
				<span data-bind></span>
				<span data-bind>label: <text-node></text-node></span>
			</div>`
		),
		bindings() {
			const b1 = bound.text( { ref: 'foo' } );
			const b2 = bound.childText( { ref: 'bar', index: 1 } );	
			return ( nodes, context ) => {
				b1( nodes[0], context );
				b2( nodes[1], context );
			};
		}
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo', bar: 'bar' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, 
			`<div>
				<span>foo</span>
				<span>label: bar</span>
			</div>`
	);
});

test( 'section with node with two ', t => {

	const template = {
		fragment: Diamond.makeFragment(
			`<ul data-bind><section-node></section-node></ul>`
		),
		bindings() {
			const b1 = bound.section( { 
				type: 'for', 
				ref: 'items', 
				template: {
					fragment: Diamond.makeFragment( 
						`<li data-bind><text-node></text-node>: <text-node></text-node></li>`
					),
					bindings() {
						const b1 = bound.childText( { ref: 'foo' } );
						const b2 = bound.childText( { ref: 'bar', index: 2 } );	
						return ( nodes, context ) => {
							b1( nodes[0], context );
							b2( nodes[0], context );
						};
					}
				}
			});
			return ( nodes, context ) => {
				b1( nodes[0], context );
			};
		}
	};
	
	new Diamond( { 
		template, 
		data: { 
			items: [
				{ foo: 'foo1', bar: 'bar1' },
				{ foo: 'foo2', bar: 'bar2' },
				{ foo: 'foo3', bar: 'bar3' }
			]
		},
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<ul><li>foo1: bar1</li><li>foo2: bar2</li><li>foo3: bar3</li><!--for--></ul>' );
});


(function testFor(){
	
	test( '#for section', t => {

		const template = {
			fragment: Diamond.makeFragment(
				`<ul data-bind><section-node></section-node></ul>`
			),
			bindings() {
				const b1 = bound.section( { 
					type: 'for', 
					ref: 'items', 
					template: {
						fragment: Diamond.makeFragment( 
							`<li data-bind></li>`
						),
						bindings() {
							const b1 = bound.text( { ref: '.' } );
							return  ( nodes, context ) => {
								b1( nodes[0], context );
							};
						}
					}
				});
				return ( nodes, context ) => {
					b1( nodes[0], context );
				};
			}
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
			fragment: Diamond.makeFragment( `<section-node></section-node>` ),
			bindings() {
				const b1 = bound.section( { 
					type: 'for', 
					ref: 'items', 
					template: {
						fragment: Diamond.makeFragment( 
							`<li data-bind></li>`
						),
						bindings() {
							const b1 = bound.text( { ref: '.' } );
							return  ( nodes, context ) => {
								b1( nodes[0], context );
							};
						}
					}
				});
				return ( nodes, context, fragment ) => {
					b1( fragment, context );
				};
			}
		};
		
		new Diamond( { 
			template, 
			data: { items: [ 1, 2, 3 ] }, 
			el: fixture 
		});	
		
		t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );

	});
}());


(function testNestedFor(){
	
	const childBindings = () => {
		const b1 = bound.childText({ ref: 'value' });
		const b2 = bound.section( { 
			type: 'for', 
			ref: 'children', 
			template: {
				fragment: Diamond.makeFragment( 
					`<li data-bind></li>`
				),
				bindings() {
					const b1 = bound.text( { ref: '.' } );
					return( nodes, context ) => {
						b1( nodes[0], context );
					};
				}
			}
		});
		return ( nodes, context ) => {
			b1( nodes[0], context );
			b2( nodes[1], context );
		};
	};
	
	const bindings = () => {
		const b1 = bound.section( { 
			type: 'for', 
			ref: 'items', 
			template: {
				fragment: Diamond.makeFragment(
					'<li data-bind><text-node></text-node>' +
						'<ul data-bind><section-node></section-node></ul>' +
					'</li>'
				),
				bindings: childBindings
			}
		});

		return ( nodes, context ) => {
			b1( nodes[0], context );
		};
	};
	
	test( 'nested #for sections', t => {

		const template = {
			fragment: Diamond.makeFragment( 
				`<ul data-bind><section-node></section-node></ul>`
			),
			bindings
		};
		
		new Diamond( { 
			template, 
			data: { items: [
				{ value: 'A', children: [ 1, 2, 3 ] },
				{ value: 'B', children: [ 4, 5, 6 ] },
				{ value: 'C', children: [ 7, 8, 9 ] } 
			]}, 
			el: fixture 
		});	
		
		t.equal( fixture.innerHTML, '<ul><li>A<ul><li>1</li><li>2</li><li>3</li><!--for--></ul></li><li>B<ul><li>4</li><li>5</li><li>6</li><!--for--></ul></li><li>C<ul><li>7</li><li>8</li><li>9</li><!--for--></ul></li><!--for--></ul>' );

	});
	
}());

(function testIf() {
	
	const template = {
		fragment: Diamond.makeFragment( `<section-node></section-node>` ),
		bindings() {
			const b1 = bound.section({ 
				type: 'if', 
				ref: 'condition', 
				template: {
					fragment: Diamond.makeFragment( 
						`<li data-bind><text-node></text-node></li>`
					),
					bindings() {
						const b1 = bound.text( { ref: 'foo' } );
						return ( nodes, context ) => {
							b1( nodes[0], context );
						};
					}
				}
			});
			return ( nodes, context, fragment ) => {
				b1( fragment, context );
			};
		}
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

/*
(function testWith() {
	
	const template = {
		fragment: Diamond.makeFragment( `<section-node></section-node>` ),
		bindings: [
			bound.section({ 
				type: 'with', 
				ref: 'obj', 
				template: {
					fragment: Diamond.makeFragment( 
						`<p data-bind>
							<text-node></text-node>
							<text-node></text-node>
						</p>`
					),
					bindings: [
						bound.wrap([
							bound.childText( { ref: 'a', index: 1 } ),
							bound.childText( { ref: 'b', index: 3 } )
						])
					]
				}
			})
		]
	};
		
	test( '#with section', t => {
		new Diamond( { 
			template, 
			data: { obj: { a: 'A', b: 'B' } }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, `<p>
							A
							B
						</p><!--with-->` );
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
*/