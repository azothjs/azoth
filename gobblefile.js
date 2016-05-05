const gobble = require( 'gobble' );
const buble = require( 'rollup-plugin-buble' );
const path = require( 'path' );

const tests = gobble( 'test/tests' );

const index = tests.include( '*.js' )
	.transform( function importFiles( code ) {
		const filename = this.filename;
		const basename = path.basename( filename, path.extname( filename ) );	
		return `import './${basename}';`;
	})
	.transform( 'concat', { 
		dest: 'index.js', 
		separator: '\n' 
	});

const test = gobble( [ index, tests, 'src' ] )
	.transform( 'rollup', {
		plugins: [ buble() ],
		entry: 'index.js',
		dest:  'test.js',
		format: 'iife'
	});

const build = gobble( [ index, tests, 'src' ] )
	.transform( 'rollup', {
		plugins: [ buble() ],
		entry: 'main.js',
		dest:  'diamond.js',
		format: 'iife'
	});

const min = build.transform( 'uglifyjs', { ext: '.min.js' });

const html = gobble( 'test' ).include( 'index.html' );
const research = gobble( 'research' ).moveTo( 'research' );

module.exports = gobble( [ test, build, min, html, research ] );
