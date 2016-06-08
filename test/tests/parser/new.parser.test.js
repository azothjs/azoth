import { test, module } from './qunit';
import { $, getContext } from './new-parser/parser';

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
			bindings: [{ ref: '.', type: 'attr' }]
		});
	});
	
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
	
});
