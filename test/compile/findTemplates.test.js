/* global describe, it */
import findTemplates from '../../src/compiler/findTemplates';
import chai from 'chai';
const assert = chai.assert;

describe.skip( 'get tagged templates', () => {

	it( 'finds $ tagged templates', () => {
		
		const templates = findTemplates(`
			import { html as $ } from 'diamond';
			
			const template = ( place, foo ) => $\`<span class="hello" class-foo=\${foo} data-custom="custom">hello \${place}</span>\`;

			export default template;
		`);


		assert.equal( templates.length, 1 );
		const { html, bindings, scope } = templates[0];
		assert.ok( html );
		assert.ok( bindings );
		assert.ok( scope );

		assert.equal( bindings.length, 2, 'expression length' );

	});

	it( 'nested $ tagged templates', () => {
		
		const source = `
			import { html as $ } from 'diamond';

			const template = items => $\`
				<ul>
					\${ items.map( item => $\`
						<li>\${ item }</li>
					\`)}
				</ul>
			\`;

			export default template;
		`;

		const templates = findTemplates( source );
		assert.equal( templates.length, 1 );
	});

	it( 'side by side $ tagged templates', () => {
		
		const source = `
			import { html as $ } from 'diamond';

			const template1 = foo => $\`\${foo}\`;
			const template2 = foo => $\`\${foo}\`;

		`;

		const templates = findTemplates( source );
		assert.equal( templates.length, 2 );
	});
});