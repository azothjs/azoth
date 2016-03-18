export default function render( clonable, tree, context ){
	const clone = clonable.cloneNode( true );
	const renderers = tree.iterate( clone );

	var renderer;
	for ( var i = 0, l = renderers.length; i < l; i++ ) {
		renderer = renderers[i];
		renderer.fn( context, renderer.node );
	}
	
	return clone;
}