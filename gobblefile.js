const gobble = require( 'gobble' );
const path = require( 'path' );
const camelCase = require( 'camelCase' );

const buble = require( 'rollup-plugin-buble' );


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


const test = gobble( [ index, tests, 'src' ] ).transform( 'rollup', {
	plugins: [ buble() ],
	entry: 'index.js',
	dest:  'test.js',
	format: 'iife'
});


const build = gobble( [ index, tests, 'src' ] ).transform( 'rollup', {
	plugins: [ buble() ],
	entry: 'main.js',
	dest:  'diamond.js',
	format: 'iife'
});

const min = build.transform( 'uglifyjs', { ext: '.min.js' });

const html = gobble( 'test' ).include( 'index.html' );
const research = gobble( 'research' ).moveTo( 'research' );

// var modules = gobble( 'assets/npm' )
// 	.transform( bundleNpm, {
// 		modules: Object.keys( package.dependencies ),
// 		dest: 'modules.js'
// 	});

module.exports = gobble( [ test, build, min, /*modules,*/ html, research ] );
