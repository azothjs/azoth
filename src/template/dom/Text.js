import Binding from '../../Binding';
import $ from './static';

export default class DOMText extends Binding {
	node () {
		return $.text( '' );
	}
	
	bind ( context, target ) {
		target.node.textContent = context.get( this.binding.ref );
	}
}