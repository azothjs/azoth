import Binding from '../../Binding';
import Section from './Section';
import Text from './Text';
import Property from './Property';


export default function bound( binding, children ) {
	return bound.section( binding, children );
}

bound.text = function( binding ) {
	return new Text( binding );
};

bound.property = function( name, binding ) {
	return new Property( name, binding );
};

bound.section = function( binding, template ) {
	return new Section( binding, template );
};
