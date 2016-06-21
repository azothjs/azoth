/* global describe, it, require */
// wtf?
// import acorn from 'acorn';
import hyperx from 'hyperx';
import chai from 'chai';
const assert = chai.assert;


describe( 'compiler', () => {
	
	it( 'finds $ tagged templates', () => {
		
		const hx = hyperx( ( tag, attrs, children ) => {
			console.log( 'hx!', tag, attrs, children );
		});

		const template = place => hx`<span>hello ${place}</span>`;

		template();

	});
});