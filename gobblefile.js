const gobble = require( 'gobble' );

const js = gobble( [ 'assets', 'test/tests' ] )
	.transform( 'babel', {
		sourceMaps: true,
		whitelist: [ 'es6.parameters', 'es6.destructuring' ]
	})
	.transform( 'rollup', {
  		entry: 'test.new.index.js',
  		// entry: 'test.first.js',
  		dest:  'test.js',
		format: 'umd'
	});

const index = gobble( 'test' ).include( 'index.html' );
const research = gobble( 'research' ).moveTo( 'research' );


module.exports = gobble( [ js, index, research ] );
