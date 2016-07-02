/* global describe, it */
import compile from '../../src/compiler/compile';
import chai from 'chai';
const assert = chai.assert;

describe.only( 'get tagged templates', () => {

	it( 'finds $ tagged templates', () => {
		
		const { html, code } = compile(`
			place => $\`<span>hello *\${place}</span>\`
		`)[0];
		
		// assert.equal( html, 
		// 	`<span data-bind>hello <text-node></text-node></span>` 
		// );

		assert.equal( code, `
			(() => {
				const render = renderer( makeFragment( '<span data-bind>hello <text-node></text-node></span>' ) );
				const __ctb0 = __ctb[0];
				return place => {
					const nodes = render();
					place.subscribe( __ctb0( nodes[ nodes.length ] ) );
					return nodes[ nodes.length ];
				};
			})()
		`);
	
	});

});