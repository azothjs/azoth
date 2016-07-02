/* global describe, it */
import chai from 'chai';
import parseTaggedTemplate from '../../src/compiler/parseTaggedTemplate';
const assert = chai.assert;

describe( 'makes', () => {

	it( 'element attributes', () => {
		const { html, bindings } = parseTaggedTemplate(`
			done => $\`<span 
				class="hello" 
				class-done=\${done} 
				data-custom="custom"></span>\`
		`);
		
		assert.deepEqual( html, 
			`<span class="hello" data-custom="custom" data-bind></span>` 
		);

		assert.deepEqual( bindings, 
			[{ 
				elIndex: 0,
				type: 'class',
				name: 'class-done',
				ref: 'done' 
			}]
		);
	});


	it( 'element text nodes', () => {
		const { html, bindings } = parseTaggedTemplate(`
			place => $\`
				<span>\${place}</span>
				<span>hello \${place}</span>
				<span>hello \${place}!</span>
			\`
		`);
			
		assert.equal( html, `
				<span data-bind><text-node></text-node></span>
				<span data-bind>hello <text-node></text-node></span>
				<span data-bind>hello <text-node></text-node>!</span>
			` 
		);

		assert.deepEqual( bindings, 
			[{ 
				elIndex: 0,
				type: 'text',
				index: 0,
				ref: 'place' 
			},
			{ 
				elIndex: 1,
				type: 'text',
				index: 1,
				ref: 'place' 
			},
			{ 
				elIndex: 2,
				type: 'text',
				index: 1,
				ref: 'place' 
			}]
		);

		// const greeting = place => $`<span>hello *${place}</span>`;
		// const render = $$(
		// 	'<span data-bind>hello <text-node></text-node></span>',
		// 	(() => { 
		// 		const b0 = bound.text( { ref: 'place', index: 1 } );
		// 		return nodes => {
		// 			b0( nodes[0] );
		// 		};
		// 	})()
		// );

		// const render2 = function $$( fragment, bind ) {
		// 	return () => {

		// 	}
		// }

		// fb.on( 'value', render );

		
	});

	it( 'simple nested element with text node', () => {
		const { html, bindings } = parseTaggedTemplate(`
			foo => $\`<div><span>\${foo}</span></div>\`
		`);
			
		assert.equal( html, `<div><span data-bind><text-node></text-node></span></div>` );

		assert.deepEqual( bindings, 
			[{ 
				elIndex: 0,
				type: 'text',
				index: 0,
				ref: 'foo' 
			}]
		);
		
	});

	it( 'element with mixed child nodes', () => {
		const { html, bindings } = parseTaggedTemplate(`
			foo => $\`<div><span>hello</span> \${foo}</div>\`
		`);
			
		assert.equal( html, `<div data-bind><span>hello</span> <text-node></text-node></div>` );

		assert.deepEqual( bindings, 
			[{ 
				elIndex: 0,
				type: 'text',
				index: 2,
				ref: 'foo' 
			}]
		);	
	});

	it( 'multiple bound element in mixed child nodes', () => {
		const { html, bindings } = parseTaggedTemplate(`
			( greeting, place ) => $\`<div><span>\${greeting}</span> \${place}</div>\`
		`);
			
		assert.equal( html, `<div data-bind><span data-bind><text-node></text-node></span> <text-node></text-node></div>` );

		assert.deepEqual( bindings, 
			[{ 
				elIndex: 0,
				type: 'text',
				index: 2,
				ref: 'place' 
			}, { 
				elIndex: 1,
				type: 'text',
				index: 0,
				ref: 'greeting' 
			}]
		);	
	});

	it( 'expression', () => {

		// ( x, y ) => $`*${x} + *${y} = *${x + y}`;
		const compiled = parseTaggedTemplate(`
			( x, y ) => $\`*\${x} + *\${y} = *\${x + y}\`
		`);

		assert.deepEqual( compiled, {
			html: '<text-node></text-node> + <text-node></text-node> = <text-node></text-node>',
			bindings: [{ 
				type: 'text',
				index: 1,
				observable: true,
				ref: 'x',
				elIndex: 0 
			}, { 
				type: 'text',
				index: 3,
				observable: true,
				ref: 'y',
				elIndex: 0 
			}, { 
				type: 'text',
				index: 5,
				observable: true,
				expr: 'x + y',
				params: 'x,y',
				elIndex: 0
			}]
		});
		
	});


});

describe( 'block compiles', () => {

	it.skip( 'basic section', () => {
		const compiled = parseTaggedTemplate(`
			items => $\`<ul>
				#\${ items.map( item => $\`
					<li>\${ item }</li>
				\`)}
			</ul>\`
		`);

		assert.deepEqual( compiled, {
			html: `<ul data-bind>
				<section-node></section-node>
			</ul>`,
			bindings: [{ 
				elIndex: 0,
				type: 'section',
				index: 1,
				expr: '?' 
			}]
		});	
		
	});
});