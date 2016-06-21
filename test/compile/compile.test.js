/* global describe, it, require */

const acorn = require('acorn');
// const fs = require( 'fs' );
import getTagged from '../../src/compiler/getTagged';
import compile from '../../src/compiler/compile';
import chai from 'chai';
const assert = chai.assert;

describe( 'get tagged templates', () => {
	let tagged, template;

	const source = `
		import { $ } from './new-parser/parser';

		const template = ( place, foo ) => $\`<span class="hello" class-foo=\${foo} data-custom="custom">hello \${place}</span>\`;

		export default template;
	`;

	it( 'finds $ tagged templates', () => {
		
		const tagged = getTagged( source );
		assert.equal( tagged.length, 1 );
		const quasi = tagged[0].quasi;

		const expressions = quasi.expressions;
		assert.equal( expressions.length, 2, 'expression length' );

		const quasis = quasi.quasis;
		assert.equal( quasis.length, 3, 'quaisis length' );

	});
});
	
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