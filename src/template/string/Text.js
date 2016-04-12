import Binding from '../../Binding';
import $ from './static';

class Placeholder {
	toString() { return '' }
};

export default class StringText extends Binding {
	node () {
		return new Placeholder();
	}
	
	bind ( context, target ) {
		target.parent[ target.index ] = context.get( this.binding.ref );
	}
}