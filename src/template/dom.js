import $tatic from './dom/static';
import bound from './dom/bound';
import DOMTemplate from './dom/DOMTemplate';


export default { 
	type: 'dom',
	$tatic: $tatic, 
	bound: bound,
	getTemplate( template ) { 
		return new DOMTemplate( template ); 
	}  
};
