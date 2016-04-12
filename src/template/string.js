import s from './string/static';
import dynamic from './string/dynamic';
import StringTemplate from './string/StringTemplate';


export default {  
	type: 'string',
	$: s, 
	Đ: dynamic,
	getTemplate( fragment, bindingTree ) { 
		return new StringTemplate( fragment, bindingTree ); 
	} 
};
