import Binding from '../../Binding';
import $ from './static';

export default class StringText extends Binding {
	node () {
		return {};
	}
	
	bind ( context, target ) {
		target.parent[ target.index ] = context.get( this.binding.ref );
	}
}