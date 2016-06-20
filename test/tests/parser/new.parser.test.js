import { test, module } from './qunit';
import { $, when, getContext } from './new-parser/parser';

module( 'new parser', () => {
	
	test( 'root text node', t => {
		
		const template = place => $`<span>hello ${place}</span>`;
		
		const result = template( getContext() );
		
		t.deepEqual( result, {
			html: '<span>hello <text-node data-bind></text-node></span>',
			bindings: [{ ref: '.', type: 'text' }]
		});
		
	});
	
	test( 'two children of root in text nodes', t => {
		
		const template = ({ first, last }) => $`
			<span>${first} ${last}</span>
		`;
		
		const result = template( getContext() );

		t.deepEqual( result, {
			html: '<span><text-node data-bind></text-node> ' +
				'<text-node data-bind></text-node></span>',
			bindings: [
				{ ref: 'first', type: 'text' },
				{ ref: 'last', type: 'text' }
			]
		});
	});

	test( 'grandchild prop', t => {
		
		const template = parent => $`${parent.child.grandchild}`;
		
		const result = template( getContext() );
		
		t.deepEqual( result, {
			html: '<text-node data-bind></text-node>',
			bindings: [{ 
				ref: [ 'grandchild', 'child' ], 
				type: 'text' 
			}]
		});
	});
	
	test( 'map root context', t => {
		
		const template = colors => $`
			<ul>${colors.map( color => $`<li>${color}</li>` )}</ul>
		`;
		
		const result = template( getContext() );

		t.deepEqual( result, {
			html: '<ul><section-node data-bind></section-node></ul>',
			bindings: [{ 
				ref: '.', 
				type: 'map', 
				template: {
					html: '<li><text-node data-bind></text-node></li>',
					bindings: [{ ref: '.', type: 'text' }]
				}
			}]
		});
	});
		
	test( 'attribute value', t => {
		
		const template = className => $`<span class=${className}></span>`;
		
		const result = template( getContext() );
		
		t.deepEqual( result, {
			html: '<span class data-bind></span>',
			bindings: [{ 
				ref: '.', 
				name: 'class',
				type: 'attr' 
			}]
		});
	});
	
	class W {
		
		render () {
			return {
				y: 2,
				get z() {
					return this.y * 2;
				},
				render: ( x ) => $`
					<div>
						<input value=${x}> + <input value=${y}>
						<input value=*${this.y}*> = 
						<span>${x + this.z}</span>
					</div>
					<button on-click="${() => x = y = 0}">reset</button>`
			};
		}
	}

	test( 'expression text node', t => {
		
		const template = ({ x, y }) => $`
			${x} + ${y} = ${() => x + y}
		`;
		
		const result = template( getContext() );
		
		t.deepEqual( result, {
			html: '<text-node data-bind></text-node> + ' +
				'<text-node data-bind></text-node> = ' +
				'<text-node data-bind></text-node>',
			bindings: [
				{ ref: 'x', type: 'text' },
				{ ref: 'y', type: 'text' },
				{ expr: '() => x + y', type: 'text' }
			]
		});
	});

	// TODO: for now need to use expressions () => place()

	// test( 'expression root function call', t => {
		
	// 	const template = place => $`
	// 		<span>hello ${place()}</span>
	// 	`;
		
	// 	const result = template( context ).trim();


	// 	t.equal( result, '<binding-set name="bset0"></binding-set><span>hello <text-node data-bind="b0"></text-node></span>' );
		
	// 	t.deepEqual( $.getSet( 'bset0' ), {
	// 		b0: { ref: '.', type: 'text' }
	// 	});
	// });

	test( 'event handler', t => {
		
		const template = () => $`
			<span on-click-touchstart=${({ node }) => node.textContent = 'yo!'}></span>
		`;
		
		const result = template();
		t.deepEqual( result, {
			html: '<span data-bind></span>',
			bindings: [{ 
				expr: `({ node }) => node.textContent = 'yo!'`, 
				type: 'event',
				events: [ 'click', 'touchstart' ] 
			}]
		});
	});

// 	test( 'when', t => {

// 		const template = fooish => $`
// 			${when( 
// 				() => fooish === 'foo', 
// 				() => `<span>FOO</span>` 
// 			)}
// 		`;
		
// 		const result = template( getContext() );
		
// 		t.deepEqual( result, {
// 			html: '<section-node data-bind></section-node>',
// 			bindings: [{ 
// 				condition: '() => fooish === \'foo\'',
// 				falsey: null,
// 				truthy: '() => `<span>FOO</span>`',
// 				type: 'when'
// 			}]
// 		});
// 	});
	
// 	test( 'when', t => {

// 		const fooish = foo => $`<span>${foo}</span>`;

// 		const template = foo => `${foo.bar ? fooish(foo) : ''}`;
		
// 		t.equal( template, 'not!');
// 	});
});
