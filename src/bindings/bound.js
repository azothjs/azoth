import section from './section';
import text from './text';
import childText from './childText';
import property from './property';
import attribute from './attribute';

function wrap( bindings ) {
	const l = bindings.length;
	return ( context, node ) => {
		for( var i = 0; i < l; i++ ) bindings[i]( context, node );
	}; 
}

export default {
	text, childText, section, property, attribute, wrap
};