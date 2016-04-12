import s from './dom/static';
import dynamic from './dom/dynamic';
import DOMTemplate from './dom/DOMTemplate';


export default { 
	type: 'dom',
	$: s, 
	Đ: dynamic,
	getTemplate( fragment, bindingTree ) { 
		return new DOMTemplate( fragment, bindingTree ); 
	}  
};
