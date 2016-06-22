/* global describe, it, require */
import getTagged from '../../src/compiler/getTagged';
import chai from 'chai';
const assert = chai.assert;

describe( 'get tagged templates', () => {

	it( 'finds $ tagged templates', () => {
		
		const tagged = getTagged(`
			import { $ } from './new-parser/parser';

			const template = ( place, foo ) => $\`<span class="hello" class-foo=\${foo} data-custom="custom">hello \${place}</span>\`;

			export default template;
		`);

		assert.equal( tagged.length, 1 );
		const quasi = tagged[0].quasi;

		const expressions = quasi.expressions;
		assert.equal( expressions.length, 2, 'expression length' );

		const quasis = quasi.quasis;
		assert.equal( quasis.length, 3, 'quaisis length' );

	});

	it( 'nested $ tagged templates', () => {
		
		const source = `
			import { $ } from 'diamond';

			const template = items => $\`
				<ul>
					\${ items.map( item => $\`
						<li>\${ item }</li>
					\`)}
				</ul>
			\`;

			export default template;
		`;

		const tagged = getTagged( source );
		assert.equal( tagged.length, 1 );
	});
});