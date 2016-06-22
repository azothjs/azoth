/* global describe, it, require */

import compile from '../../src/compiler/compile';
import chai from 'chai';
const assert = chai.assert;

describe( 'compiles', () => {

	it( 'element attributes', () => {
		const { html, bindings } = compile(`
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
				expr: 'done' 
			}]
		);
	});


	it( 'element text nodes', () => {
		const { html, bindings } = compile(`
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
				type: 'child-text',
				index: 0,
				expr: 'place' 
			},
			{ 
				elIndex: 1,
				type: 'child-text',
				index: 1,
				expr: 'place' 
			},
			{ 
				elIndex: 2,
				type: 'child-text',
				index: 1,
				expr: 'place' 
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
		const { html, bindings } = compile(`
			foo => $\`<div><span>\${foo}</span></div>\`
		`);
			
		assert.equal( html, `<div><span data-bind><text-node></text-node></span></div>` );

		assert.deepEqual( bindings, 
			[{ 
				elIndex: 0,
				type: 'child-text',
				index: 0,
				expr: 'foo' 
			}]
		);
		
	});

	it( 'element with mixed child nodes', () => {
		const { html, bindings } = compile(`
			foo => $\`<div><span>hello</span> \${foo}</div>\`
		`);
			
		assert.equal( html, `<div data-bind><span>hello</span> <text-node></text-node></div>` );

		assert.deepEqual( bindings, 
			[{ 
				elIndex: 0,
				type: 'child-text',
				index: 2,
				expr: 'foo' 
			}]
		);	
	});

	it( 'multiple bound element in mixed child nodes', () => {
		const { html, bindings } = compile(`
			( greeting, place ) => $\`<div><span>\${greeting}</span> \${place}</div>\`
		`);
			
		assert.equal( html, `<div data-bind><span data-bind><text-node></text-node></span> <text-node></text-node></div>` );

		assert.deepEqual( bindings, 
			[{ 
				elIndex: 0,
				type: 'child-text',
				index: 2,
				expr: 'place' 
			}, { 
				elIndex: 1,
				type: 'child-text',
				index: 0,
				expr: 'greeting' 
			}]
		);	
	});
});

describe( 'block compiles', () => {


	it.skip( 'basic section', () => {
		const compiled = compile(`
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