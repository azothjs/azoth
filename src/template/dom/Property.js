import Binding from '../../Binding';

export default class Property extends Binding {
	
	constructor( name, binding ) {
		super( binding );
		this.name = name;
	}
	
	node () {
		return name;
	}
	
	bind ( context, obj ) {
		obj[ this.name ] = context.get( this.binding.ref );
	}
}