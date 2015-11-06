const gobble = require( 'gobble' );

const js = gobble( [ 'assets', 'test/tests' ] )
	.transform( 'babel', {
		sourceMaps: true,
		blacklist: ['es6.modules', 'strict']
	})
	.transform( 'rollup', {
  		entry: 'test.index.js',
  		dest:  'test.js',
		format: 'umd'
	});

const index = gobble( 'test' ).include( 'index.html' );

module.exports = gobble( [ js, index ] );
