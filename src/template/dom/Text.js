// import Binding from '../../Binding';
import $ from './static';

// export default class DOMText extends Binding {
// 	node () {
// 		return $.text( '' );
// 	}
	
// 	bind ( context, node ) {
// 		node.textContent = context.get( this.binding.ref );
// 	}
// }

export default function domText( binding ) {
	
	return {
		node () {
			return $.text( '' );
		},
		
		bind ( context, node ) {
			node.textContent = context.get( binding.ref );
		}
	};
}