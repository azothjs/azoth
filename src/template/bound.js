import Section from './Section';
import Text from './Text';
import Property from './Property';

const bound = {
	text( binding ) {
		return new Text( binding );
	},
	
	property( name, binding ) {
		return new Property( name, binding );
	},

	section( binding, template ) {
		return new Section( binding, template );
	}
}

export default bound;
