import Binding from '../../Binding';

export default class Property extends Binding {
	
	constructor( name, binding ) {
		super( binding );
		this.name = name;
	}
	
	node () {
		return;
	}
	
	bind ( context, node ) {
		node[ this.name ] = context.get( this.binding.ref );
	}
}