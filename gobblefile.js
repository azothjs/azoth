const gobble = require( 'gobble' );
const path = require( 'path' );
const camelCase = require( 'camelCase' );

// const bundleNpm = require( './bundle-npm' );
// const package = require( './package.json' );

const tests = gobble( 'test/tests' )
const index = tests.transform( function( code ) {
	const filename = this.filename;
	const basename = path.basename( filename, path.extname( filename ) );
	
	return `import './${basename}';`;
	
}).transform( 'concat', { dest: 'index.js' });


const js = gobble( [ index, tests, 'src' ] ).transform( 'babel', {
	sourceMaps: true,
	whitelist: [ 'es6.parameters', 'es6.destructuring' ]
}).transform( 'rollup', {
	entry: 'index.js',
	dest:  'test.js',
	format: 'umd'
});

const html = gobble( 'test' ).include( 'index.html' );
const research = gobble( 'research' ).moveTo( 'research' );

// var modules = gobble( 'assets/npm' )
// 	.transform( bundleNpm, {
// 		modules: Object.keys( package.dependencies ),
// 		dest: 'modules.js'
// 	});

module.exports = gobble( [ js, /*modules,*/ html, research ] );
