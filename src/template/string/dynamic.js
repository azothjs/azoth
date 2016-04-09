import Binding from '../../Binding';
import Section from './Section';
import Text from './Text';


export default function Đ( binding, children ) {
	return Đ.section( binding, children );
}

Đ.text = function( binding ) {
	return new Text( binding );
};

Đ.section = function( binding, template ) {
	return new Section( binding, template );
};
