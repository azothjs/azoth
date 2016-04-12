import getBindingTree from './getBindingTree';

export default function bind( queue, context ) {
	var each;
	for ( var i = 0, l = queue.length; i < l; i++ ) {
		each = queue[i];
		each.binding.bind( context, each );
	}
}