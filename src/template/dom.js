import $tatic from './dom/static';
import bound from './dom/bound';
import DOMTemplate from './dom/DOMTemplate';


export default { 
	type: 'dom',
	$tatic: $tatic, 
	bound: bound,
	getTemplate( fragment, bindingTree ) { 
		return new DOMTemplate( fragment, bindingTree ); 
	}  
};
