export default class Attribute {
	
	constructor( name, binding ) {
		this.name = name;
		this.binding = binding;
	}
	
	bind ( context, element ) {
		element.setAttribute( this.name, context.get( this.binding.ref ) );
	}
}