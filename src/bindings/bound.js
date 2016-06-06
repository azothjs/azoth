import section from './section';
import text from './text';
import childText from './childText';
import property from './property';
import attribute from './attribute';

function wrap( wrapped ) {
	const l = wrapped.length;
	return ( node, context, owner ) => {
		for( var i = 0; i < l; i++ ) wrapped[i]( node, context, owner );
	}; 
}

export default {
	text, childText, section, property, attribute, wrap
};