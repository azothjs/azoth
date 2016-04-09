export default function deepSlice( array ) {
	
	function copy( arr ) {
		arr = arr.slice();
		
		var child;
		
		for( var i = 0, l = arr.length; i < l; i++ ) {
			if ( Array.isArray( child = arr[i] ) ) {
				arr[i] = copy( child );
			}
		}
		
		return arr;
	}
	
	return copy( array );
	
}