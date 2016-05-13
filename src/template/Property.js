export default class Property {
	
	constructor( name, binding ) {
		this.name = name;
	}
	
	bind ( context, obj ) {
		obj[ this.name ] = context.get( this.binding.ref );
		
		// this is for outputing to copy to static doc...
		// if ( this.name === 'checked' ) {
		// 	if ( obj[ this.name ] ) obj.setAttribute( 'checked', '' )
		// }
		// else {
		// 	obj.setAttribute( this.name, obj[ this.name ] );
		// }
	}
}