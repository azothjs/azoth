export default function bind( queue, context ) {
	var each;
	for ( var i = 0, l = queue.length; i < l; i++ ) {
		each = queue[i];
		each.binding( context, each.node );
	}
}