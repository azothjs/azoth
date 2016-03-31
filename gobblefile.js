const gobble = require( 'gobble' );
const path = require( 'path' );
const camelCase = require( 'camelCase' );

// const bundleNpm = require( './bundle-npm' );
// const package = require( './package.json' );

const tests = gobble( 'test/tests' )
const bad = /^test\./;

const index = tests.include( '*.js' ).transform( function( code ) {
	const filename = this.filename;
	const basename = path.basename( filename, path.extname( filename ) );
	
	if ( bad.test( basename ) ) return '';
	
	return `import './${basename}';`;
	
}).transform( 'concat', { 
	dest: 'index.js', 
	separator: '\n' 
});


const js = gobble( [ index, tests, 'src' ] ).transform( 'babel', {
	plugins: [ 'babel-plugin-transform-es2015-parameters', 'babel-plugin-transform-es2015-destructuring' ],
	sourceMaps: true
}).transform( 'rollup', {
	entry: 'index.js',
	dest:  'test.js',
	format: 'iife'
});

const html = gobble( 'test' ).include( 'index.html' );
const research = gobble( 'research' ).moveTo( 'research' );

// var modules = gobble( 'assets/npm' )
// 	.transform( bundleNpm, {
// 		modules: Object.keys( package.dependencies ),
// 		dest: 'modules.js'
// 	});

module.exports = gobble( [ js, /*modules,*/ html, research ] );
